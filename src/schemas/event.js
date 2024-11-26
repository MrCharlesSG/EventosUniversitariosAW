export function validateEventData(input) {
    const { title, description, dateTime, location, capacity, eventTypeID } = input;

    if (typeof title !== 'string' || title.trim() === '') {
        return { valid: false, message: "El título es obligatorio" };
    }

    if (description && typeof description !== 'string') {
        return { valid: false, message: "La descripción debe ser un texto válido" };
    }

    const datePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/; 
    if (!datePattern.test(dateTime)) {
        return { valid: false, message: "La fecha y hora deben estar en un formato válido (YYYY-MM-DDTHH:MM)" };
    }

    const eventDate = new Date(dateTime);
    const currentDate = new Date();
    if (eventDate < currentDate) {
        return { valid: false, message: "La fecha y hora no pueden estar en el pasado" };
    }

    if (typeof location !== 'string' || location.trim() === '') {
        return { valid: false, message: "La ubicación es obligatoria" };
    }
    const capacityInt = typeof capacity === 'string' ? parseInt(capacity, 10) : capacity;
   
    if (isNaN(capacityInt) || capacityInt <= 0) {
        return { valid: false, message: "La capacidad debe ser un número positivo" };
    }

    if (typeof eventTypeID !== 'string' && typeof eventTypeID !== 'number') {
        return { valid: false, message: "El tipo de evento debe ser un valor válido" };
    }

    return { valid: true, message: "El evento es válido", data: input };
}
