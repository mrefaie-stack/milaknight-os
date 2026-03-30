async function run() {
    try {
        console.log("Fetching http://localhost:3000/api/dev/live-test...");
        const res = await fetch("http://localhost:3000/api/dev/live-test");
        const data = await res.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Fetch error:", e.message);
    }
}
run();
