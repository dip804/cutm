document.getElementById('sendMessage').addEventListener('click', () => {
    fetch('/send-message', { // Adjust endpoint according to your Node.js server
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: 'Hello from the client!' })
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('response').innerText = `Response: ${data.response}`;
    })
    .catch(error => console.error('Error:', error));
});
