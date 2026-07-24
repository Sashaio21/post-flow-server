import cron from "node-cron";
import app from "./app";
import { cleanupUnverifiedUsers } from "./jobs/cleanup-unverified";

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});

// // Запускаем сразу при старте сервера — на случай, если накопился мусор,
// // пока сервер был выключен
// cleanupUnverifiedUsers();

// // И дальше — каждую минуту проверяем заново
// cron.schedule("* 0 * * *", cleanupUnverifiedUsers);