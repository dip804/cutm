# save this as server.py
import socket
import threading

def handle_client(client_socket):
    while True:
        try:
            request = client_socket.recv(1024)
            if not request:
                break
            print(f"Received from client: {request.decode('utf-8')}")
            client_socket.send(request)
        except Exception as e:
            print(f"Error: {e}")
            break
    client_socket.close()

def handle_command(command_socket):
    while True:
        try:
            command = input("Enter command to send: ")
            command_socket.send(command.encode('utf-8'))
            response = command_socket.recv(4096)
            print(f"Command output: {response.decode('utf-8')}")
        except Exception as e:
            print(f"Error: {e}")
            break

server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server.bind(('0.0.0.0', 5555))
server.listen(5)
print("Listening for clients on port 5555...")

command_server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
command_server.bind(('0.0.0.0', 8888))
command_server.listen(5)
print("Listening for commands on port 8888...")

while True:
    client_socket, addr = server.accept()
    print(f"Accepted connection from {addr}")
    client_handler = threading.Thread(target=handle_client, args=(client_socket,))
    client_handler.start()
    
    command_socket, _ = command_server.accept()
    print("Accepted command connection")
    command_handler = threading.Thread(target=handle_command, args=(command_socket,))
    command_handler.start()
