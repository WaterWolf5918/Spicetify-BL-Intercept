import { Application, NativeRequest, Router } from "@oak/oak";
import { oakCors } from "https://deno.land/x/cors/mod.ts";
import { Layer } from "@oak/oak/router";
import { join } from "jsr:@std/path@1";

const router = new Router();
const debug = true;
const dryRun = false;
// let lyricsMapping = {"43243": "songName [id].lrc"}

interface LineLyricsContent {
    "Type": "Vocal" | "???";
    "OppositeAligned": boolean;
    "Text": string;
    "StartTime": number;
    "EndTime": number;
}

interface LineLyrics {
    "StartTime": number;
    "EndTime": number;
    "Type": "Line" | "";
    "Content": LineLyricsContent[];
}

function getSongFileByID(id: string) {
    const files = Deno.readDirSync("./lyrics");
    console.log("====| Dir List Mapping |====");
    for (const file of files) {
        const idRegex = new RegExp("(.*) \\[(.*)\\]", "g");
        const regexResult = idRegex.exec(file.name);
        if (regexResult !== null && regexResult.length > 1) {
            console.log(`[*] ${regexResult[1]} -> ${regexResult[2]}`);
            if (id !== regexResult[2]) continue;
            console.log(`\x1B[1A[=] ${regexResult[1]} -> ${regexResult[2]} `);
            console.log("============================\n");

            return file;
        }
    }
    console.log("============================\n");
}


function lrcExtractKV(lrcLine: string): undefined | [string,string] {
    const kvRegex = /\[(.*): (.*)\]/g;

    const regexEx = kvRegex.exec( lrcLine.split("] ")[0].replaceAll("\r", "") );
    if (!regexEx) return undefined;
    return [regexEx[1], regexEx[2]];
}

function lrcExtractInfo(lrcLine: string): [number,string] {
    const lineRegex = /\[(.*):(.*)\]\s(.*)/g;
    const InfoRegexEx = lineRegex.exec(lrcLine);
    let time = 0;

    lineRegex.lastIndex = 0;

    if (!InfoRegexEx) return [0,"Error: LRC Line Invalid"];
    time = (parseInt(InfoRegexEx[1]) * 60) + parseFloat(InfoRegexEx[2]);
    time = +time.toFixed(3);
    return [time,InfoRegexEx[3]];
}


function rewriteLrctoLine(lrc: string): LineLyrics {
    const lyrics: LineLyrics = {
        "StartTime": Infinity,
        "EndTime": -Infinity,
        "Type": "Line",
        "Content": [
            {
                "Type": "Vocal",
                "OppositeAligned": true,
                "Text": "Spicetify BL Intercept 0.1",
                "StartTime": 0,
                "EndTime": 0,
            },
            {
                "Type": "Vocal",
                "OppositeAligned": true,
                "Text": "LRC Rewrite",
                "StartTime": 0,
                "EndTime": 0,
            },
        ],
    };
    const lines = lrc.split("\n");

    for (let i=0;i<lines.length;i++){
        const line = lines[i];
        let kv = undefined;
        let time = 0;
        let nextTime = 0;
        let timeDelta = 0;
        let text = "";
        let info = lrcExtractInfo(line)
        if (line.split("] ").length < 2) {
            kv = lrcExtractKV(line)
        } else {
            time = info[0]
            if ((i+1) <= lines.length) {
                nextTime = lrcExtractInfo(lines[i+1])[0]
                timeDelta = Math.round(nextTime - time)
            } else {
                nextTime = info[0] + 2
            }

            text = info[1];
        }

        if (kv) {
            // console.log(`kv=${kv?.join(": ")}`);
            // const lyricLine:LineLyricsContent = {
            //     "StartTime": 0,
            //     "EndTime": 0,
            //     "OppositeAligned": true,
            //     "Type": "Vocal",
            //     "Text": `${kv.join(': ')}`
            // }
            // lyrics.Content.push(lyricLine)
        } else {

            if (lyrics.StartTime > time) lyrics.StartTime = time;
            if (lyrics.EndTime < time) lyrics.EndTime = time;
            // console.log(`
            //     time="${time}"
            //     endTime="${nextTime}"
            //     delta="${timeDelta}"
            //     text="${text}"
            //     raw="${line.replace("\r", "")}"`);
            const lyricLine:LineLyricsContent = {
                "StartTime": time,
                "EndTime": nextTime,
                "OppositeAligned": false,
                "Type": "Vocal",
                "Text": text
            }
            lyrics.Content.push(lyricLine)
        }
    }
    // console.log(`start=${lyrics.StartTime}\nend=${lyrics.EndTime}`)

    return lyrics;
}


router.get("/lyrics/:id", async (ctx) => {
    console.log(
        `${ctx.request.ip} ${ctx.params.id} ${ctx.request.method} >> ${ctx.request.url.href}`,
    );

    let lyrics;
    const file = getSongFileByID(ctx.params.id);
    // console.log(ctx.params.id)
    // console.log(file)

    if (file) {
        console.log("[+] Local has lyrics.");
        if (!dryRun) ctx.response.status = 200;
        const fileToks = file.name.split(".");
        switch (fileToks[fileToks.length - 1]) {
            case "lrc": {
                lyrics = rewriteLrctoLine(
                    Deno.readTextFileSync(join("./lyrics", file.name)),
                );
                break;
            }
        }
        
        if (!dryRun) ctx.response.body = lyrics;
    // } else {
    //     console.error(`[*] Local file not found for ${ctx.params.id}.`);
    //     // This use to reachout to a proxy that just proxied beautiful-lyrics.socalifornian.live since the host file was modified in a way that made it unreachable.
        
    //     // const blFetch = await fetch(
    //     //     `http://192.168.1.201:9421/lyrics/${ctx.params.id}`,
    //     // );
    //     // const blBody = await blFetch.text();
    //     // if (!dryRun) {
    //     //     ctx.response.status = blFetch.status;
    //     //     ctx.response.body = blBody;
    //     // }

    //     // console.log(blBody == '')
    //     // Use to check if body was good, I patched it out so hopefuly local lyrics worrk
    //     if (false == true) {
    //         console.log(blBody)
    //         console.log(`[+] Remote has lyrics.`);
    //     } else {
    //         const lyrics: LineLyme": 0,
    //             "EndTime": 0,
    //             "Type": "Line",
    //             "Content": [
    //                 {
    //                     "Type": "Vocal",
    //                     "OppositeAligned": true,
    //                     "Text": "Spicetify BL Intercept 0.1",
    //                     "StartTime": 0,
    //                     "EndTime": 0,
    //                 },
    //                 {
    //                     "Type": "Vocal",
    //                     "OppositeAligned": true,
    //                     "Text": "No Lyrics Detected",
    //                     "StartTime": 0,
    //                     "EndTime": 0,
    //                 },
    //             ],
    //         };
    //         if (!dryRun) {
    //             ctx.response.status = 200;
    //             ctx.response.body = lyrics;
    //         }

    //         console.log(
    //             `[-] Neither remote or local has lyrics. [Attemping to search for lyrics... Future]`,
    //         );
    //     }
        // lyrics = rewriteLrctoLine("")
    }
});

// router.get("/", (ctx) => {
//     ctx.response.body = "Hello world";
// });

const app = new Application();
app.use(oakCors());
app.use(router.routes());
app.use(router.allowedMethods());

app.listen({
    port: 443,

    cert: Deno.readTextFileSync("./socalifornian.live+3.pem"),
    key: Deno.readTextFileSync(".//socalifornian.live+3-key.pem"),
});
console.log("Ready to intercept requests.");
