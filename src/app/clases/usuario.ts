export class Usuario {

    username!: string;
    email!: string;
    password!: string;

    constructor(user_username: string,user_email: string, user_password: string) {
        this.username = user_username;
        this.email = user_email;
        this.password = user_password;
    }
}
