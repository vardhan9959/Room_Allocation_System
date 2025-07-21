document.addEventListener("DOMContentLoaded", () => {
    // Helper to get room name
    function getRoomName(room) {
        if (room.name) return room.name;
        return `Room ${room.room_number}`;
    }

    // Fetch all rooms and update UI
    function fetchAndUpdateRooms() {
        fetch('/rooms')
            .then(response => {
                if (!response.ok) throw new Error('Failed to fetch rooms');
                return response.json();
            })
            .then(rooms => {
                const tableBody = document.getElementById("room-table-body");
                const roomSelect = document.getElementById("room-select");
                const cancelRoomSelect = document.getElementById("cancel-room-select");

                // Clear previous data
                tableBody.innerHTML = '';
                roomSelect.innerHTML = '<option value="">-- Select Room --</option>';
                cancelRoomSelect.innerHTML = '<option value="">-- Select Room --</option>';

                rooms.forEach(room => {
                    // Add to table
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${getRoomName(room)}</td>
                        <td>${room.room_number}</td>
                        <td>${room.ac ? 'Yes' : 'No'}</td>
                        <td class="${room.status === 'Available' ? 'available' : 'booked'}">${room.status}</td>
                    `;
                    tableBody.appendChild(row);

                    // Add to booking dropdown if available
                    if (room.status === 'Available') {
                        const option = document.createElement("option");
                        option.value = room.room_number;
                        option.textContent = `${getRoomName(room)} (${room.room_number})`;
                        roomSelect.appendChild(option);
                    }

                    // Add to cancellation dropdown if booked
                    if (room.status === 'Booked') {
                        const option = document.createElement("option");
                        option.value = room.room_number;
                        option.textContent = `${getRoomName(room)} (${room.room_number})`;
                        cancelRoomSelect.appendChild(option);
                    }
                });
            })
            .catch(err => {
                console.error("Error fetching rooms:", err);
                alert("Failed to load rooms. Please refresh the page.");
            });
    }

    // Initial load
    fetchAndUpdateRooms();

    // Handle booking form submission
    document.getElementById("booking-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const form = e.target;
        const bookingData = {
            room_number: form["room-select"].value, // Type will be forced to int in backend
            check_in_date: form["check-in-date"].value,
            check_in_time: form["check-in-time"].value,
            check_out_date: form["check-out-date"].value,
            check_out_time: form["check-out-time"].value,
        };
        try {
            const response = await fetch('/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingData),
            });
            if (response.ok) {
                document.getElementById("booking-message").textContent = `Booking successful for room ${bookingData.room_number}!`;
                document.getElementById("booking-message").style.color = "var(--success)";
                form.reset();
                fetchAndUpdateRooms(); // Refresh UI
            } else {
                throw new Error('Booking failed');
            }
        } catch (err) {
            document.getElementById("booking-message").textContent = "Error: " + err.message;
            document.getElementById("booking-message").style.color = "var(--danger)";
        }
    });

    // Handle cancellation form submission
    document.getElementById("cancel-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const roomNumber = e.target["cancel-room-select"].value;
        try {
            const response = await fetch(`/cancel_booking/${roomNumber}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                document.getElementById("cancel-message").textContent = `Booking for room ${roomNumber} canceled!`;
                document.getElementById("cancel-message").style.color = "var(--success)";
                fetchAndUpdateRooms(); // Refresh UI
            } else {
                throw new Error('Cancellation failed');
            }
        } catch (err) {
            document.getElementById("cancel-message").textContent = "Error: " + err.message;
            document.getElementById("cancel-message").style.color = "var(--danger)";
        }
    });

    // Handle user form submission
    document.getElementById("user-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const form = e.target;
        const email = form["email"].value;
        const name = form["name"].value;
        const contact = form["contact"].value;

        // Validate Gmail
        const isValidGmail = /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email);
        if (!isValidGmail) {
            alert("Please enter a valid Gmail address!");
            return;
        }

        const userData = { name, contact, email };
        try {
            const response = await fetch('/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData),
            });
            if (response.ok) {
                alert("User saved successfully!");
                form.reset();
            } else {
                throw new Error('User save failed');
            }
        } catch (err) {
            alert("Error: " + err.message);
        }
    });
});
