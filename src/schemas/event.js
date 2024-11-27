export function validateEventData(input) {
    const { title, description, timeInit, location, eventTypeID, durationHours, durationMinutes } = input;

    // Validación del título
    if (typeof title !== 'string' || title.trim() === '') {
        return { valid: false, message: "El título es obligatorio" };
    }

    // Validación de la descripción (opcional)
    if (description && typeof description !== 'string') {
        return { valid: false, message: "La descripción debe ser un texto válido" };
    }

    // Validación de timeInit (Fecha de inicio)
    const datePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d{3})?(Z)?$/;
    if (!datePattern.test(timeInit)) {
        return { valid: false, message: "La fecha de inicio debe estar en un formato válido (YYYY-MM-DDTHH:MM)" };
    }

    const eventInit = new Date(timeInit);
    const currentDate = new Date();

    // Validar que la fecha de inicio no sea en el pasado
    if (eventInit < currentDate) {
        return { valid: false, message: "La fecha y hora no pueden estar en el pasado" };
    }

    // Validación de la duración (horas y minutos)
    if (isNaN(durationHours) || durationHours < 0) {
        return { valid: false, message: "La duración en horas debe ser un valor válido y no negativo" };
    }

    if (isNaN(durationMinutes) || durationMinutes < 0 || durationMinutes >= 60) {
        return { valid: false, message: "La duración en minutos debe ser un valor entre 0 y 59" };
    }

    // Validación de la ubicación
    if (typeof location !== 'string' || location.trim() === '') {
        return { valid: false, message: "La ubicación es obligatoria" };
    }

    // Validación del tipo de evento
    if (typeof eventTypeID !== 'string' && typeof eventTypeID !== 'number') {
        return { valid: false, message: "El tipo de evento debe ser un valor válido" };
    }

    return { valid: true, message: "El evento es válido", data: input };
}
