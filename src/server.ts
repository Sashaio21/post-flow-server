import app from "./app";

const PORT = 3000;

// Именно этот файл — точка входа при запуске (npm run dev / npm run start).
// app.listen начинает слушать порт и принимать реальные HTTP-запросы
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});