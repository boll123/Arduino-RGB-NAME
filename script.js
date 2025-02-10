let port;
let reader;

document.getElementById("connectButton").addEventListener("click", async () => {
    try {
        // ขอสิทธิ์ใช้ Serial Port
        port = await navigator.serial.requestPort();
        await port.open({ baudRate: 9600 });

        document.getElementById("statusText").innerText = "เชื่อมต่อสำเร็จ!";
        document.getElementById("statusText").style.color = "green";
        document.getElementById("statusEimoji").innerText = "❤️‍🔥";

        // เริ่มอ่านข้อมูล
        const readableStream = port.readable;
        reader = readableStream.getReader();
        
        // เรียกฟังก์ชันอ่านข้อมูล
        readLoop();
    } catch (err) {
        console.error("Serial Connection Error: ", err);
        alert("เชื่อมต่อไม่สำเร็จ! ลองใหม่อีกครั้ง");
        document.getElementById("statusText").innerText = "ไม่ได้เชื่อมต่อ";
        document.getElementById("statusText").style.color = "red";
        document.getElementById("statusEimoji").innerText = "💔";
    }
});

async function readLoop() {
    try {
        let dataBuffer = '';
        while (true) {
            const { value, done } = await reader.read();
            if (done) {
                console.log("การอ่านสตรีมปิด");
                break;
            }
            
            if (value) {
                // แปลง ArrayBuffer เป็นสตริง
                const chunk = new TextDecoder().decode(value);
                dataBuffer += chunk;

                // แยกข้อมูลออกเป็นบรรทัด
                const lines = dataBuffer.split('\n');
                
                // ประมวลผลทุกบรรทัดที่สมบูรณ์
                while (lines.length > 1) {
                    const line = lines.shift().trim();
                    updateRGB(line);
                }

                // เก็บส่วนที่ไม่สมบูรณ์ไว้
                dataBuffer = lines[0] || '';
            }
        }
    } catch (err) {
        console.error("เกิดข้อผิดพลาดขณะอ่านข้อมูล Serial:", err);
    } finally {
        if (reader) {
            reader.releaseLock();
        }
    }
}

function updateRGB(data) {
    try {
        // Regex จับคู่ข้อมูล RGB
        const rgbMatch = data.match(/R:(\d+),G:(\d+),B:(\d+)/);
        const nameMatch = data.match(/Name:([^,]+)/);
        const addressMatch = data.match(/Address:(.+)/);

        if (rgbMatch && nameMatch && addressMatch) {
            const r = parseInt(rgbMatch[1]);
            const g = parseInt(rgbMatch[2]);
            const b = parseInt(rgbMatch[3]);
            const name = nameMatch[1].trim();
            const address = addressMatch[1].trim();

            // อัปเดตค่า RGB
            document.getElementById("rValue").innerText = `R: ${r}`;
            document.getElementById("gValue").innerText = `G: ${g}`;
            document.getElementById("bValue").innerText = `B: ${b}`;

            // อัปเดตชื่อและที่อยู่พร้อมสี
            document.getElementById("nameText").innerHTML = `Name: <span style="color: rgb(${r},${g},${b})">${name}</span>`;
            document.getElementById("addressText").innerHTML = `Address: <span style="color: rgb(${r},${g},${b})">${address}</span>`;

            // อัปเดตสีกล่อง
            let rgbColor = `rgb(${r},${g},${b})`;
            document.getElementById("colorBox").style.backgroundColor = rgbColor;

            // คำนวณเอฟเฟกต์ภาพ
            let hue = Math.atan2(g - b, r - g) * (180 / Math.PI);
            let brightness = (r + g + b) / 765 * 1.5;
            let sepia = 1;

            let shadowColor = `rgba(${r},${g},${b}, 0.8)`;
            document.getElementById("statusEimoji").style.filter = 
                `sepia(${sepia}) ` +
                `hue-rotate(${hue}deg) ` +
                `brightness(${brightness}) ` +
                `drop-shadow(0px 0px 20px ${shadowColor})`;

            console.log("อัปเดตค่าสำเร็จ:", { r, g, b, name, address });
        } else {
            console.log("ไม่พบข้อมูลที่ตรงกัน:", data);
        }
    } catch (err) {
        console.error("เกิดข้อผิดพลาดใน updateRGB:", err);
    }
}

// เพิ่มการจัดการข้อผิดพลาดสำหรับการเชื่อมต่อ Serial
if ('serial' in navigator) {
    navigator.serial.addEventListener('disconnect', (event) => {
        console.log('อุปกรณ์ถูกตัดการเชื่อมต่อ');
        document.getElementById("statusText").innerText = "ไม่ได้เชื่อมต่อ";
        document.getElementById("statusText").style.color = "red";
        document.getElementById("statusEimoji").innerText = "💔";
    });
} else {
    alert('Web Serial API ไม่รองรับในเบราว์เซอร์นี้');
}