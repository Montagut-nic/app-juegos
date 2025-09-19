import { Supabase } from "../core/supabase";
export class Usuario {

    name: string;
    email: string;
    authId: string;
    avatarUrl: string;
    puntos: number;
    active: boolean;
    fechaRegistro: string;


    constructor(user_id: string, user_email: string, user_name: string, avatar_url: string = "", user_points: number = 0, user_active: boolean = false, fecha_registro: string = "") {
        this.authId = user_id;
        this.email = user_email;
        this.name = user_name;
        this.avatarUrl = avatar_url;
        this.puntos = user_points;
        this.fechaRegistro = new Date(fecha_registro).toLocaleDateString();
        this.active = user_active;
    }

    async saveFullUser(supabase: Supabase) {
        await supabase.saveUserData(this.authId, {
            userEmail: this.email,
            userName: this.name,
            avatar_url: this.avatarUrl,
            userPoints: this.puntos,
            userActive: this.active
        });
    }

    async savePoints(points: number, supabase: Supabase) {
        this.puntos += points;
        await supabase.saveUserData(this.authId, {
            userPoints: this.puntos
        });
    }

    async saveNewName(new_name: string, supabase: Supabase) {
        this.name = new_name;
        await supabase.saveUserData(this.authId, {
            userName: this.name
        });
    }

    async saveNewEmail(new_email: string, supabase: Supabase) {
        this.email = new_email;
        await supabase.saveUserData(this.authId, {
            userEmail: this.email
        });
    }
}
