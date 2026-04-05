"use client";

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { format } from "date-fns";
import QRCode from "qrcode";

interface CertificateRendererProps {
    name: string;
    amount: number;
    date: string;
    identifier: string; // certificate_number or transaction_id
    type: 'pass' | 'payout';
}

export interface CertificateRendererRef {
    download: () => void;
}

const CertificateRenderer = forwardRef<CertificateRendererRef, CertificateRendererProps>(({
    name,
    amount,
    date,
    identifier,
    type
}, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isGenerated, setIsGenerated] = useState(false);

    useImperativeHandle(ref, () => ({
        download: () => {
            const canvas = canvasRef.current;
            if (canvas) {
                const link = document.createElement("a");
                link.download = `SharkFunded-${type.toUpperCase()}-${identifier}.png`;
                link.href = canvas.toDataURL("image/png");
                link.click();
            }
        }
    }));

    useEffect(() => {
        const generateCertificate = async () => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            // Load Background Image
            const img = new Image();
            img.crossOrigin = "anonymous";
            // Use the new JPG templates
            img.src = type === 'pass' ? "/certificates/pass.jpg" : "/certificates/payout.jpg";

            img.onload = async () => {
                // Set Ultra-high-resolution canvas size (4x)
                const scaleFactor = 4; 
                canvas.width = img.width * scaleFactor;
                canvas.height = img.height * scaleFactor;

                ctx.scale(scaleFactor, scaleFactor);
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = "high";
                ctx.drawImage(img, 0, 0, img.width, img.height);

                const centerX = img.width / 2;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";

                // 1. Name Style - Positioned precisely on the white line
                ctx.font = "600 64px 'Playfair Display', Serif";
                ctx.fillStyle = "#FFFFFF";
                ctx.shadowColor = "rgba(0,0,0,0.5)";
                ctx.shadowBlur = 10;
                // Perfect alignment on the line
                const nameY = type === 'pass' ? img.height * 0.355 : img.height * 0.355;
                ctx.fillText(name, centerX, nameY);

                // 2. Amount Style - Positioned in the designated text area
                ctx.font = "900 100px Sans-Serif";
                const amountY = type === 'pass' ? img.height * 0.55 : img.height * 0.58;
                
                const gradient = ctx.createLinearGradient(0, amountY - 60, 0, amountY + 60);
                gradient.addColorStop(0, "#FFFFFF");
                gradient.addColorStop(1, "#22D3EE"); // Brighter Cyan for better contrast

                ctx.fillStyle = gradient;
                ctx.shadowBlur = 40;
                ctx.shadowColor = "rgba(34, 211, 238, 0.6)";
                ctx.fillText(`$${amount.toLocaleString()}`, centerX, amountY);

                // 3. Date Style - REMOVED PER USER REQUEST

                // 4. Identifier - Bottom Right (Subtle)
                ctx.font = "bold 16px Monospace";
                ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
                ctx.textAlign = "right";
                ctx.fillText(`CERT ID: ${identifier}`, img.width - 60, img.height - 60);

                // 5. QR Code - REMOVED PER USER REQUEST
                setIsGenerated(true);
            };
        };

        generateCertificate();
    }, [name, amount, date, identifier, type]);

    return (
        <div className="relative w-full aspect-[1.414] rounded-xl overflow-hidden shadow-2xl bg-[#05080F]">
            <canvas
                ref={canvasRef}
                className="w-full h-full object-contain"
                style={{ opacity: isGenerated ? 1 : 0, transition: "opacity 0.5s ease-in" }}
            />
            {!isGenerated && (
                <div className="absolute inset-0 flex items-center justify-center text-white/50 text-sm tracking-widest uppercase">
                    Preparing Achievement...
                </div>
            )}
        </div>
    );
});

CertificateRenderer.displayName = "CertificateRenderer";

export default CertificateRenderer;
