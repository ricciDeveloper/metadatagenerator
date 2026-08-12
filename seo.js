require("dotenv").config();

const fs = require("fs");
const axios = require("axios");
const cheerio = require("cheerio");
const { createObjectCsvWriter } = require("csv-writer");
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const MODEL = "gemini-3.1-flash-lite";

async function extractPageContent(url) {
    try {
        const { data } = await axios.get(url, {
            timeout: 30000,
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
            }
        });

        const $ = cheerio.load(data);

        $("script, style, noscript").remove();

        const title = $("title").text().trim();

        const h1 = $("h1")
            .map((i, el) => $(el).text().trim())
            .get()
            .join(" ");

        const bodyText = $("body")
            .text()
            .replace(/\s+/g, " ")
            .trim()
            .substring(0, 10000);

        return {
            title,
            h1,
            bodyText
        };
    } catch (error) {
        console.error(`Erro ao coletar ${url}`);
        return null;
    }
}

async function generateMetadata(url, content) {
    const prompt = `
Você é um especialista em SEO.

Analise o conteúdo abaixo e gere:

1. Meta Title entre 50 e 55 caracteres.
    1.1 JAMAIS ultrapasse 55 caracteres.
    1.2 O IDEAL é sempre 55 caracteres.
    1.3 NÃO COPIAR O H1
2. Meta Description entre 150 e 155 caracteres.
    2.1 JAMAIS ultrapsse os 155 caracteres
    2.2 JAMAIS gere a descrição com menos de 150 caracteres

Regras:
- O TITLE NÃO DEVE SER IGUAL AO H1
- NUNCA GERAR O TITLE COM MAIS DE 60 CARACTERES
- NUNCA GERAR A DESCRIPTION COM MAIS DE 155 CARACTERES
- NUNCA GERAR A DESCRIPTION COM MENOS DE 150 CARACTERES
- NUNCA GERAR O TITLE COM MENOS DE 50 CARACTERES    
- Caso o title gerado possua mais de 62 caracteres, reavaliar, e reescrever seguindo as diretrizes determinadas.
- Português do Brasil.
- Não utilizar aspas.
- Não utilizar emojis.
- Title deve ser atrativo e otimizado para SEO.
- Deve Finalizar o Title com "- ".
- O title e a description devem fazer sentido para o conteúdo da página
- Description deve resumir a página e incentivar o clique.
- Description deve conter CTAs, exemplo "Descubra, Aproveite, etc"
- Respeite rigorosamente os limites de caracteres.
- Retorne APENAS JSON válido.

Formato:

{
  "title": "",
  "description": ""
}

URL:
${url}

Title atual:
${content.title}

H1:
${content.h1}

Conteúdo:
${content.bodyText}
`;

    try {
        const response = await ai.models.generateContent({
            model: MODEL,
            contents: prompt
        });

        const text = response.text.trim();

        const json = JSON.parse(
            text
                .replace(/```json/g, "")
                .replace(/```/g, "")
                .trim()
        );

        return {
            url,
            title: json.title,
            titleLength: json.title.length,
            description: json.description,
            descriptionLength: json.description.length
        };
    } catch (error) {
        console.error(`Erro Gemini: ${url}`);
        console.error(error.message);

        return {
            url,
            title: "",
            titleLength: 0,
            description: "",
            descriptionLength: 0
        };
    }
}

async function processUrls() {
    const urls = fs
        .readFileSync("./urls.txt", "utf8")
        .split("\n")
        .map(url => url.trim())
        .filter(Boolean);

    const outputFile = "seo-metadata.csv";

    // Cria o cabeçalho caso o arquivo não exista
    if (!fs.existsSync(outputFile)) {
        fs.writeFileSync(
            outputFile,
            "URL,META_TITLE,TITLE_LENGTH,META_DESCRIPTION,DESCRIPTION_LENGTH\n",
            "utf8"
        );
    }

    for (const url of urls) {
        try {
            console.log(`Processando ${url}`);

            const content = await extractPageContent(url);

            if (!content) {
                console.log(`Falha ao coletar conteúdo: ${url}`);
                continue;
            }

            const metadata = await generateMetadata(
                url,
                content
            );

            const escapeCsv = (value = "") =>
                `"${String(value).replace(/"/g, '""')}"`;

            const line = [
                escapeCsv(metadata.url),
                escapeCsv(metadata.title),
                metadata.titleLength,
                escapeCsv(metadata.description),
                metadata.descriptionLength
            ].join(",");

            fs.appendFileSync(
                outputFile,
                line + "\n",
                "utf8"
            );

            console.log(
                `✓ Salvo: ${metadata.titleLength} caracteres no title | ${metadata.descriptionLength} caracteres na description`
            );

            await new Promise(resolve =>
                setTimeout(resolve, 1500)
            );

        } catch (error) {
            console.error(
                `Erro ao processar ${url}:`,
                error.message
            );
        }
    }

    console.log("Processamento concluído.");
}

processUrls();