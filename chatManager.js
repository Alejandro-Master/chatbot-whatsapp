const { supabase } = require('./supabase');

class ChatManager {
    async getSession(phoneNumber) {
        const { data } = await supabase
            .from('sessions')
            .select('*')
            .eq('phone_number', phoneNumber)
            .single();

        if (!data) return null;
        if (new Date(data.expires_at) < new Date()) {
            await this.clearSession(phoneNumber);
            return null;
        }
        return data;
    }

    async createSession(phoneNumber) {
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
        const { data } = await supabase
            .from('sessions')
            .upsert({
                phone_number: phoneNumber,
                state: 'initial',
                last_activity: new Date().toISOString(),
                expires_at: expiresAt.toISOString()
            }, { onConflict: 'phone_number' })
            .select()
            .single();
        return data;
    }

    async updateState(phoneNumber, newState) {
        await supabase
            .from('sessions')
            .update({ state: newState, last_activity: new Date().toISOString() })
            .eq('phone_number', phoneNumber);
    }

    async updateActivity(phoneNumber) {
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
        await supabase
            .from('sessions')
            .update({
                last_activity: new Date().toISOString(),
                expires_at: expiresAt.toISOString()
            })
            .eq('phone_number', phoneNumber);
    }

    async clearSession(phoneNumber) {
        await supabase.from('sessions').delete().eq('phone_number', phoneNumber);
    }
}

module.exports = { ChatManager };