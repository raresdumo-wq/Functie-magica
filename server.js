const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Permitem date mai mari pentru cand veti avea multe lectii

// Acestea le vom seta in Render la "Environment Variables"
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "RAR"; // Parola suprema

// RUTA 1: Login si preluare date
app.post('/login', async (req, res) => {
    const { password } = req.body;

    // Luam datele din Supabase
    const { data, error } = await supabase.from('db_state').select('*').eq('id', 1).single();
    if (error) return res.status(500).json({ error: 'Eroare baza de date' });

    let userRole = null;

    if (password === ADMIN_PASSWORD) {
        userRole = "Admin";
    } else {
        const foundUser = data.users.find(u => u.pass === password);
        if (foundUser) userRole = foundUser.role;
    }

    if (userRole) {
        // Daca parola e corecta, trimitem inapoi rolul si TOATE datele clasei
        res.json({ role: userRole, state: data });
    } else {
        res.status(401).json({ error: 'Parola incorecta' });
    }
});

// RUTA 2: Salvare date (Sync)
app.post('/sync', async (req, res) => {
    const { state } = req.body;
    // state contine array-urile actualizate de pe frontend
    
    const { error } = await supabase.from('db_state').update({
        users: state.users,
        content: state.content,
        lectii: state.lectii,
        docs: state.docs,
        resp: state.resp
    }).eq('id', 1);

    if (error) return res.status(500).json({ error: 'Eroare la salvare' });
    res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server pornit pe portul ${PORT}`));