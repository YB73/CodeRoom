package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type User struct {
	ID       string `json:"id" bson:"_id"`
	Username string `json:"username" bson:"username"`
	Password string `json:"password" bson:"password"`
}

type Room struct {
	ID        string    `json:"id" bson:"_id"`
	Name      string    `json:"name" bson:"name"`
	CreatedAt time.Time `json:"created_at" bson:"created_at"`
}

var (
	upgrader = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true // For development
		},
	}
	clients     = make(map[*websocket.Conn]string)
	broadcast   = make(chan Message)
	mongoClient *mongo.Client
)

type Message struct {
	Type    string `json:"type"`
	Content string `json:"content"`
	Room    string `json:"room"`
	User    string `json:"user"`
}

func main() {
	// Connect to MongoDB
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	clientOptions := options.Client().ApplyURI("mongodb://localhost:27017")
	var err error
	mongoClient, err = mongo.Connect(ctx, clientOptions)
	if err != nil {
		log.Fatal(err)
	}

	r := mux.NewRouter()

	// Auth routes
	r.HandleFunc("/api/register", registerHandler).Methods("POST")
	r.HandleFunc("/api/login", loginHandler).Methods("POST")

	// Room routes
	r.HandleFunc("/api/rooms", createRoomHandler).Methods("POST")
	r.HandleFunc("/api/rooms", getRoomsHandler).Methods("GET")

	// WebSocket route
	r.HandleFunc("/ws/{roomId}", handleWebSocket)

	// Start WebSocket broadcaster
	go handleMessages()

	// Serve static files
	r.PathPrefix("/").Handler(http.FileServer(http.Dir("./static")))

	log.Println("Server starting on :8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}
	defer conn.Close()

	roomId := mux.Vars(r)["roomId"]
	clients[conn] = roomId

	for {
		var msg Message
		err := conn.ReadJSON(&msg)
		if err != nil {
			delete(clients, conn)
			break
		}
		msg.Room = roomId
		broadcast <- msg
	}
}

func handleMessages() {
	for msg := range broadcast {
		for client, roomId := range clients {
			if roomId == msg.Room {
				err := client.WriteJSON(msg)
				if err != nil {
					client.Close()
					delete(clients, client)
				}
			}
		}
	}
}

func registerHandler(w http.ResponseWriter, r *http.Request) {
	var user User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Hash password in production

	_, err := mongoClient.Database("coderoom").Collection("users").InsertOne(context.Background(), user)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
	var user User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Verify user credentials
	// Set session cookie in production

	w.WriteHeader(http.StatusOK)
}

func createRoomHandler(w http.ResponseWriter, r *http.Request) {
	var room Room
	if err := json.NewDecoder(r.Body).Decode(&room); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	room.CreatedAt = time.Now()

	_, err := mongoClient.Database("coderoom").Collection("rooms").InsertOne(context.Background(), room)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(room)
}

func getRoomsHandler(w http.ResponseWriter, r *http.Request) {
	var rooms []Room
	cursor, err := mongoClient.Database("coderoom").Collection("rooms").Find(context.Background(), nil)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if err = cursor.All(context.Background(), &rooms); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(rooms)
}
