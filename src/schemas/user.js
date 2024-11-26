
const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

export function validateUserCredentials(input) {
    const { email, password } = input;

    
    if (typeof email !== 'string' || email.trim() === '') {
        return { valid: false, message: "El correo es obligatorio" };
    }

    if (!emailRegex.test(email)) {
        return { valid: false, message: "El correo electrónico no tiene un formato válido" };
    }

    if (typeof password !== 'string' || password.trim() === '') {
        return { valid: false, message: "La contraseña es obligatoria" };
    }

    return { valid: true, message: "El objeto es válido.", data: [email, password] };
}


export function validateRegisterCredentials(input) {
    const { email, fullName, phone, facultyID, password, roleID } = input;

    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (typeof email !== 'string' || email.trim() === '') {
        return { valid: false, message: "El correo es obligatorio" };
    }

    if (!emailRegex.test(email)) {
        return { valid: false, message: "El correo electrónico no tiene un formato válido" };
    }

    if (typeof fullName !== 'string' || fullName.trim() === '') {
        return { valid: false, message: "El nombre completo es obligatorio" };
    }

    if (phone && !/^\d+$/.test(phone)) {
        return { valid: false, message: "El teléfono debe contener solo números" };
    }

    if (typeof facultyID !== 'string' || facultyID.trim() === '') {
        return { valid: false, message: "La facultad es obligatoria" };
    }

    if (typeof password !== 'string' || password.trim() === '') {
        return { valid: false, message: "La contraseña es obligatoria" };
    }

    if (typeof roleID !== 'string' || roleID.trim() === '') {
        return { valid: false, message: "El rol es obligatorio" };
    }

    return { valid: true, message: "Todos los datos son válidos", data: [email, fullName, phone, facultyID, password, roleID] };
}

export function validateModifyUserInfo(input) {
    const { fullName, phone, facultyID } = input;

    if (fullName && (typeof fullName !== 'string' || fullName.trim() === '')) {
        return { valid: false, message: "El nombre completo es obligatorio" };
    }

    if (phone && !/^\d+$/.test(phone)) {
        return { valid: false, message: "El teléfono debe contener solo números" };
    }

    if (facultyID && (typeof facultyID !== 'string' || facultyID.trim() === '')) {
        return { valid: false, message: "La facultad es obligatoria" };
    }

    return { valid: true, message: "Todos los datos son válidos" };
}

