
document.addEventListener('DOMContentLoaded', fetchEvents);


function fetchEvents() {
    const eventList = document.getElementById('event-list');
    eventList.innerHTML = '';
    const currentPath = window.location.pathname;

    const apiUrl = currentPath.includes('myevents') ? '/api/events/user' : '/api/events';
    console.log("Llamando a la API:", apiUrl, " por user ", currentUserId);
    
    fetch(apiUrl) 
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
    const organizer = item.getAttribute('data-organizer');
    const eventId = item.getAttribute('data-id'); 
    
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalDescription').textContent = description;
    document.getElementById('modalDate').textContent = date;
    document.getElementById('modalLocation').textContent = location;
    document.getElementById('modalOrganizer').textContent = organizer;


    const editButton = document.getElementById('editButton');
    if(editButton && editButton.href) editButton.href = `/events/info?eventID=${eventId}`;

    $('#eventModal').modal('show');
}

