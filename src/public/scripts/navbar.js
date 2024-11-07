document.addEventListener('DOMContentLoaded', () => {
    const notificationsButton = document.getElementById('notificationsButton');
    notificationsButton.addEventListener('click', fetchNotifications);
});

function fetchNotifications() {
    const notificationsContent = document.getElementById('notificationsContent');
    notificationsContent.innerHTML = 'Cargando notificaciones...';

    fetch('/api/notifications') 
        .then(response => response.json())
        .then(data => {
            notificationsContent.innerHTML = '';
            
            if (data) {
                console.log("the notifications ", data)
                if (data.length > 0) {
                    data.forEach(notification => {
                        const notificationItem = `
                            <div class="notification-item">
                                <strong>${notification.EventTitle}</strong>
                                <p>${notification.Message}</p>
                                <small>${new Date(notification.EventDateTime).toLocaleString()}</small>
                            </div>
                        `;
                        notificationsContent.innerHTML += notificationItem;
                        console.log("The notification  inserted ", notification)
                    });
                } else {
                    notificationsContent.innerHTML = '<p>No tienes notificaciones.</p>';
                }
            } else {
                notificationsContent.innerHTML = '<p>Error al cargar las notificaciones.</p>';
            }
        })
        .catch(error => {
            console.error('Error al cargar las notificaciones:', error);
            notificationsContent.innerHTML = '<p>Error al cargar las notificaciones.</p>';
        });
}
