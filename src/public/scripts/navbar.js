document.addEventListener('DOMContentLoaded', () => {
    const notificationsButton = document.getElementById('notificationsButton');
    notificationsButton.addEventListener('click', fetchNotificationsAndCheck);
});

function fetchNotificationsAndCheck() {
    const notificationsContent = document.getElementById('notificationsContent');
    notificationsContent.innerHTML = 'Cargando notificaciones...';
    console.log("To fetch notifications ")
    fetch('/api/notifications/andCheck') 
        .then(response => response.json())
        .then(data => {
            notificationsContent.innerHTML = '';

            if (data) {
                console.log("the notifications ", data)
                if (data.length > 0) {
                    data.forEach(notification => {
                        const notificationDate = new Date(notification.Date).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        });

                        const notificationItem = `
                            <div class="list-item ${notification.Checked ? 'read' : 'unread'}">
                                <div class="d-flex align-items-center">
                                    <div class="list-item-title">
                                        <strong>${notification.Message}</strong> 
                                    </div>
                                </div>
                                <div class="list-item-meta d-flex flex-wrap justify-content-between">
                                    <span><strong>Remitente:</strong> ${notification.Sender}</span>
                                    <span><strong>Fecha:</strong> ${notificationDate}</span>
                                </div>
                            </div>
                        `;
                        notificationsContent.innerHTML += notificationItem;
                        console.log("The notification  inserted ", notification)
                    });
                } else {
                    notificationsContent.innerHTML = '<p>No tienes notificaciones sin ver.</p>';
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
