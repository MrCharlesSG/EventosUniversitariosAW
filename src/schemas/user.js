

export function validateUserCredentials(input) {
    const { email, password } = input;
  
    if (typeof email !== 'string' || email.trim() === '') {
        return { valid: false, message: "El correo es obligatorio" };
    }
  
    if (typeof password !== 'string' || password.trim() === '') {
        return { valid: false, message: "La contraseña es obligatoria" };
    }
  
    // Si pasa todas las validaciones
    return { valid: true, message: "El objeto es válido.", data: [email, password] };
  }