

fetch("https://discord.com/api/v8/channels/825201402095599658/messages", {
    method: "POST",
    headers: {
        "Authorization": "NzA5MjQzMjE3NDc2MDU5MjA5.YKawAQ.sMGnR_mJ2bc1uPReP1c4vG0Vv0c",
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        "content": "hello",
        "tts": false
    })
}).then(async(res) => {
    console.log(await res.text());
    console.log({
        "Authorization": "NzA5MjQzMjE3NDc2MDU5MjA5.YKawAQ.sMGnR_mJ2bc1uPReP1c4vG0Vv0c",
        "Content-Type": "application/json"
    });
})


//deno run --allow-net ./libs/debugger.ts

export {}