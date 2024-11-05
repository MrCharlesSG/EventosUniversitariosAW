
document.addEventListener('DOMContentLoaded', fetchEvents);

function fetchEvents() {
    const eventList = document.getElementById('event-list');
    eventList.innerHTML = '';

    fetch('/api/events') 
        .then(response => response.json())
        .then(data => {
            data.forEach(event => {
                const eventItem = `
                    <li class="event-item" 
                        data-title="${event.Title}" 
                        data-description="${event.Description}" 
                        data-date="${new Date(event.DateTime).toLocaleString()}" 
                        data-location="${event.Location}">
                        <div class="event-title">${event.Title}</div>
                        <div class="event-description">${event.Description}</div>
                        <div class="event-details">
                            <span><img src="/public/img/calendar-icon.svg" width="13" height="13" alt="Calendar"> ${new Date(event.DateTime).toLocaleString()}</span>
                            <span><img src="/public/img/ubication-icon.svg" width="13" height="13" alt="Ubicacion"> ${event.Location}</span>
                        </div>
                    </li>
                `;
                eventList.innerHTML += eventItem;
            });

            // Agregar un evento de clic a cada elemento de lista
            const items = eventList.querySelectorAll('.event-item');
            items.forEach(item => {
                item.addEventListener('click', showModal);
            });
        })
        .catch(error => console.error('Error al cargar eventos:', error));
}


function showModal(event) {
    const item = event.currentTarget;

    const title = item.getAttribute('data-title');
    const description = item.getAttribute('data-description');
    const date = item.getAttribute('data-date');
    const location = item.getAttribute('data-location');

    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalDescription').textContent = description;
    document.getElementById('modalDate').textContent = date;
    document.getElementById('modalLocation').textContent = location;

    $('#eventModal').modal('show');
}



function whatButtonsToShow(){
    const token = document.cookie.split('; ').find(row => row.startsWith('token=')).split('=')[1];
    let userRole = null;

    if (token) {
        const decodedToken = jwt.decode(token);
        userRole = decodedToken.role; // Asegúrate que 'role' es la clave correcta
    }

    const editButton = document.getElementById('editButton');
    const subscribeButton = document.getElementById('subscribeButton');

    if (userRole === 1) { // Rol de organizador
        editButton.style.display = 'block'; // Mostrar el botón de editar
        subscribeButton.style.display = 'none'; // Ocultar el botón de apuntarse
        editButton.onclick = () => {
            console.log(`Editando el evento con ID: ${eventId}`);
            // Aquí puedes redirigir a la página de edición o abrir un formulario de edición
        };
    } else if (userRole === 2) { // Rol de usuario
        editButton.style.display = 'none'; // Ocultar el botón de editar
        subscribeButton.style.display = 'block'; // Mostrar el botón de apuntarse
        subscribeButton.onclick = () => {
            console.log(`Apuntándose al evento con ID: ${eventId}`);
            // Aquí puedes implementar la lógica para apuntarse o desapuntarse del evento
        };
    } else {
        // Si el usuario no tiene rol, ocultar ambos botones
        editButton.style.display = 'none';
        subscribeButton.style.display = 'none';
    }
}