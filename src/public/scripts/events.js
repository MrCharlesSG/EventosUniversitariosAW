
document.addEventListener('DOMContentLoaded', fetchEvents);

function fetchEvents() {
    const eventList = document.getElementById('event-list');
    eventList.innerHTML = '';

    fetch('/api/events') 
        .then(response => response.json())
        .then(data => {
            data.forEach(event => {
                console.log("The event ", event)
                const eventItem = `
                    <li class="event-item" 
                        data-id="${event.ID}" 
                        data-organizer="${event.OrganizerID}"
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
    console.log("The item ", item)
    const title = item.getAttribute('data-title');
    const description = item.getAttribute('data-description');
    const date = item.getAttribute('data-date');
    const location = item.getAttribute('data-location');
    const eventId = item.getAttribute('data-id'); // Obtener el ID del evento

    // Rellenar el modal con los datos del evento
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalDescription').textContent = description;
    document.getElementById('modalDate').textContent = date;
    document.getElementById('modalLocation').textContent = location;


    // Modificar el href del botón de editar para incluir el eventID como parámetro en la URL
    const editButton = document.getElementById('editButton');
    editButton.href = `/events/form?eventID=${eventId}`;

    // Mostrar el modal
    $('#eventModal').modal('show');
}

