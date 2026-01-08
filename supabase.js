const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

// Funciones de usuario
async function getOrCreateUser(phone) {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('phone', phone)
            .single();

        if (error && error.code === 'PGRST116') {
            const { data: newUser, error: insertError } = await supabase
                .from('users')
                .insert([{ phone }])
                .select()
                .single();

            if (insertError) throw insertError;
            return newUser;
        }

        if (error) throw error;

        await supabase
            .from('users')
            .update({ last_interaction: new Date() })
            .eq('id', data.id);

        return data;
    } catch (error) {
        console.error('Error en getOrCreateUser:', error);
        throw error;
    }
}

async function saveConversation(userId, message, sender) {
    try {
        const { error } = await supabase
            .from('conversations')
            .insert([{
                user_id: userId,
                message,
                sender
            }]);

        if (error) throw error;
    } catch (error) {
        console.error('Error guardando conversación:', error);
    }
}

async function getConversationHistory(userId, limit = 10) {
    try {
        const { data, error } = await supabase
            .from('conversations')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data.reverse();
    } catch (error) {
        console.error('Error obteniendo historial:', error);
        return [];
    }
}

module.exports = {
    supabase,
    getOrCreateUser,
    saveConversation,
    getConversationHistory
};