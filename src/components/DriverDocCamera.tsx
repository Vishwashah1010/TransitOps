import React, { useState, useRef, useEffect } from "react";
import { Camera, FileCheck, Upload, RefreshCw, CheckCircle2, ShieldCheck, X, FileText, Calendar, AlertTriangle, Eye } from "lucide-react";
import { DetailedDriver } from "../types";
import { useToasts } from "./ToastProvider";

interface DriverDocCameraProps {
  driver: DetailedDriver;
}

interface VerifiedDoc {
  id: string;
  category: string;
  capturedAt: string;
  expiryDate: string;
  verifiedBy: string;
  photoUrl: string;
  notes: string;
}

export default function DriverDocCamera({ driver }: DriverDocCameraProps) {
  const { addToast } = useToasts();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [docCategory, setDocCategory] = useState<string>("Driver License Renewal");
  const [docExpiryDate, setDocExpiryDate] = useState<string>("2027-12-31");
  const [docNotes, setDocNotes] = useState<string>("Verified by TransitOps Compliance Inspector #882");
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Default initial documents for driver
  const [verifiedDocs, setVerifiedDocs] = useState<VerifiedDoc[]>([
    {
      id: "DOC-901",
      category: "Commercial Driver License (Heavy Heavy-Duty)",
      capturedAt: "2026-05-12",
      expiryDate: driver.license_expiry || "2027-05-10",
      verifiedBy: "Inspector R. Verma (#902)",
      photoUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&q=80",
      notes: "License verified against Central Transport Database."
    },
    {
      id: "DOC-902",
      category: "Medical Examiner Fitness Certificate",
      capturedAt: driver.profile?.last_medical_checkup || "2026-05-10",
      expiryDate: driver.profile?.next_medical_due || "2027-05-10",
      verifiedBy: "Dr. A. Mehta (Chief Medical Examiner)",
      photoUrl: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=400&q=80",
      notes: "Clears driver for long-haul interstate commercial duty."
    }
  ]);

  // Start Camera Stream
  const startCamera = async () => {
    setCapturedImage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Camera access error:", err);
      addToast({
        type: "error",
        title: "Camera Access Error",
        message: "Could not access camera device. You can upload a file instead."
      });
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Take Snapshot from Camera Video Stream
  const takeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg");
      setCapturedImage(dataUrl);
      stopCamera();

      addToast({
        type: "success",
        title: "Photo Captured",
        message: "Document image captured successfully. Review and save below."
      });
    }
  };

  // Handle File Upload Fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          setCapturedImage(evt.target.result as string);
          stopCamera();
          addToast({
            type: "info",
            title: "Document Loaded",
            message: `Loaded document file: ${file.name}`
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Save Verified Document
  const handleSaveDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!capturedImage) {
      addToast({
        type: "error",
        title: "No Image Captured",
        message: "Please snap a photo with the camera or upload a document photo first."
      });
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      const newDoc: VerifiedDoc = {
        id: `DOC-${Date.now().toString().slice(-4)}`,
        category: docCategory,
        capturedAt: new Date().toISOString().split("T")[0],
        expiryDate: docExpiryDate,
        verifiedBy: "Inspector Dispatcher #882",
        photoUrl: capturedImage,
        notes: docNotes
      };

      setVerifiedDocs(prev => [newDoc, ...prev]);
      setCapturedImage(null);
      setIsVerifying(false);

      addToast({
        type: "success",
        title: "Document Verified & Archived",
        message: `${docCategory} for ${driver.name} has been verified and stored.`
      });
    }, 800);
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg flex items-center justify-between">
        <div>
          <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-blue-600" />
            Administrative Document Capture & Camera Verification
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Snap live camera photos of license renewals, medical certificates, or insurance documents for instant administrative audit.
          </div>
        </div>

        {!isCameraActive && !capturedImage && (
          <button
            onClick={startCamera}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 py-1.5 rounded-md text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Camera className="w-3.5 h-3.5" />
            Launch Camera Scanner
          </button>
        )}
      </div>

      {/* Hidden Canvas for Frame Capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera Live Stream Box */}
      {isCameraActive && (
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 shadow-2xl animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-white text-xs border-b border-slate-800 pb-2">
            <span className="font-bold flex items-center gap-2 text-blue-400">
              <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping"></span> Live Camera Document Scanner
            </span>
            <button
              onClick={stopCamera}
              className="text-slate-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="relative w-full h-64 bg-black rounded-lg overflow-hidden border border-slate-700 flex items-center justify-center">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />

            {/* Document Frame Guide Overlay */}
            <div className="absolute inset-6 border-2 border-dashed border-blue-400/70 rounded-lg pointer-events-none flex flex-col justify-between p-2">
              <div className="flex justify-between text-[10px] text-blue-300 font-mono bg-slate-900/60 px-2 py-0.5 rounded w-fit">
                ALIGN DOCUMENT WITHIN BOUNDS
              </div>
              <div className="text-center text-[10px] text-blue-300 font-mono bg-slate-900/60 px-2 py-0.5 rounded self-center">
                HOLD STILL FOR FOCUS
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="text-xs text-slate-300 hover:text-white cursor-pointer flex items-center gap-1">
              <Upload className="w-3.5 h-3.5 text-blue-400" />
              <span>Or Select Image File</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={stopCamera}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={takeSnapshot}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-1.5 rounded text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Camera className="w-3.5 h-3.5" />
                Capture Frame
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Captured Image Preview & Form */}
      {capturedImage && (
        <form onSubmit={handleSaveDocument} className="bg-blue-50/90 border border-blue-200 p-4 rounded-xl space-y-3 animate-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-blue-200 pb-2">
            <div className="font-bold text-xs text-blue-950 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Review Captured Document Image & Compliance Index
            </div>
            <button
              type="button"
              onClick={() => setCapturedImage(null)}
              className="text-slate-500 hover:text-slate-800 text-xs font-semibold cursor-pointer"
            >
              Discard & Retake
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {/* Captured Photo Container */}
            <div className="bg-slate-900 p-2 rounded-lg border border-slate-300 text-center space-y-1">
              <img src={capturedImage} alt="Captured Document" className="w-full h-44 object-contain rounded bg-slate-950" />
              <div className="text-[10px] text-slate-400 font-mono">Captured Stamp: {new Date().toLocaleString()}</div>
            </div>

            {/* Document Details Inputs */}
            <div className="space-y-2.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Document Category</label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded text-xs font-semibold focus:outline-none focus:border-blue-500"
                >
                  <option value="Commercial Driver License Renewal">Commercial Driver License Renewal</option>
                  <option value="Medical Examiner Fitness Certificate">Medical Examiner Fitness Certificate</option>
                  <option value="Vehicle Goods Insurance Policy">Vehicle Goods Insurance Policy</option>
                  <option value="Hazmat Dangerous Goods Clearance">Hazmat Dangerous Goods Clearance</option>
                  <option value="Substance Screening Result">Substance Screening Result</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Document Expiry Date</label>
                <input
                  type="date"
                  value={docExpiryDate}
                  onChange={(e) => setDocExpiryDate(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded text-xs font-mono font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Verification Remarks</label>
                <input
                  type="text"
                  value={docNotes}
                  onChange={(e) => setDocNotes(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                {isVerifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
                Verify & Archive Document Record
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Verified Documents Archive Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span>Verified Administrative Document Archive ({verifiedDocs.length} Stored)</span>
          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px] font-mono">
            COMPLIANCE VERIFIED
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {verifiedDocs.map((doc) => (
            <div key={doc.id} className="bg-white border border-slate-200 p-3 rounded-lg flex items-start gap-3 shadow-2xs">
              <img
                src={doc.photoUrl}
                alt={doc.category}
                className="w-20 h-20 object-cover rounded border border-slate-200 shrink-0 bg-slate-100"
              />

              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 line-clamp-1">{doc.category}</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded font-mono">
                    VERIFIED
                  </span>
                </div>

                <div className="text-[10px] text-slate-500 space-y-0.5">
                  <div>Captured: <strong className="text-slate-700 font-mono">{doc.capturedAt}</strong></div>
                  <div>Valid Until: <strong className="text-slate-700 font-mono">{doc.expiryDate}</strong></div>
                  <div>Auditor: <span className="text-slate-600">{doc.verifiedBy}</span></div>
                </div>

                <div className="text-[10px] text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-100 italic truncate mt-1">
                  "{doc.notes}"
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
