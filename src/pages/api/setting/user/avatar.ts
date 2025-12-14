import { NextApiRequest, NextApiResponse } from "next";
import formidable, { File } from "formidable";
import fs from "fs";
import path from "path";

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === "POST") {
        const uploadDir = path.join(process.cwd(), "/public/uploads");

        // pastikan folder uploads ada
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

        const form = formidable({
            multiples: false,
            keepExtensions: true,
            uploadDir, // folder simpan sementara
        });

        form.parse(req, (err, fields, files) => {
            if (err) return res.status(500).json({ error: "Upload failed" });

            // files.image bisa jadi File | File[]
            const file = Array.isArray(files.image) ? files.image[0] : files.image;

            if (!file) return res.status(400).json({ error: "No file uploaded" });

            const oldPath = (file as File).filepath;
            const fileName = (file as File).originalFilename || "avatar.png";
            const newPath = path.join(uploadDir, fileName);

            // pindahin file ke folder uploads
            fs.renameSync(oldPath, newPath);

            const avatarUrl = `/uploads/${fileName}`;

            // TODO: simpan avatarUrl ke DB sesuai user
            return res.status(200).json({ avatarUrl });
        });
    } else if (req.method === "DELETE") {
        // TODO: hapus avatar lama di server & update DB
        return res.status(200).json({ message: "Avatar removed" });
    } else {
        res.setHeader("Allow", ["POST", "DELETE"]);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}