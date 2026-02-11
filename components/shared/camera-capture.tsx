"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Camera, SwitchCamera, X, Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface CameraCaptureProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (file: File) => void;
}

export function CameraCapture({ open, onOpenChange, onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [error, setError] = useState<string | null>(null);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      setCapturedImage(null);

      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsStreaming(true);
      }

      // Check for multiple cameras
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((device) => device.kind === "videoinput");
      setHasMultipleCameras(videoDevices.length > 1);
    } catch (err) {
      console.error("Error accessing camera:", err);
      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError") {
          setError("Camera access denied. Please allow camera access in your browser settings.");
        } else if (err.name === "NotFoundError") {
          setError("No camera found on this device.");
        } else if (err.name === "NotReadableError") {
          setError("Camera is being used by another application.");
        } else {
          setError(`Camera error: ${err.message}`);
        }
      } else {
        setError("Failed to access camera. Please try again.");
      }
      setIsStreaming(false);
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get the image data URL
    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedImage(imageDataUrl);

    // Stop the camera stream
    stopCamera();
  }, [stopCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const confirmPhoto = useCallback(() => {
    if (!capturedImage || !canvasRef.current) return;

    // Convert data URL to blob
    canvasRef.current.toBlob(
      (blob) => {
        if (blob) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
          const file = new File([blob], `receipt-${timestamp}.jpg`, {
            type: "image/jpeg",
          });
          onCapture(file);
          onOpenChange(false);
        }
      },
      "image/jpeg",
      0.9
    );
  }, [capturedImage, onCapture, onOpenChange]);

  const switchCamera = useCallback(() => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  }, []);

  // Start camera when dialog opens
  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
      setCapturedImage(null);
      setError(null);
    }

    return () => {
      stopCamera();
    };
  }, [open, startCamera, stopCamera]);

  // Restart camera when facing mode changes
  useEffect(() => {
    if (open && isStreaming) {
      startCamera();
    }
  }, [facingMode]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>Capture Receipt</DialogTitle>
          <DialogDescription>
            Position the receipt in the frame and tap capture
          </DialogDescription>
        </DialogHeader>

        <div className="relative aspect-[4/3] bg-black">
          {/* Video preview */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 w-full h-full object-cover ${
              capturedImage ? "hidden" : ""
            }`}
          />

          {/* Captured image preview */}
          {capturedImage && (
            <img
              src={capturedImage}
              alt="Captured"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Error message */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="text-center text-white p-4 max-w-[80%]">
                <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startCamera}
                  className="mt-4"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {/* Loading state */}
          {!isStreaming && !capturedImage && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <div className="text-center text-white">
                <Camera className="h-12 w-12 mx-auto mb-2 animate-pulse" />
                <p className="text-sm">Starting camera...</p>
              </div>
            </div>
          )}

          {/* Frame guide overlay */}
          {isStreaming && !capturedImage && (
            <div className="absolute inset-4 border-2 border-white/30 rounded-lg pointer-events-none">
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white rounded-br-lg" />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-4 flex items-center justify-center gap-4 bg-background">
          {!capturedImage ? (
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="h-12 w-12"
              >
                <X className="h-6 w-6" />
              </Button>

              <Button
                size="icon"
                onClick={capturePhoto}
                disabled={!isStreaming}
                className="h-16 w-16 rounded-full"
              >
                <Camera className="h-8 w-8" />
              </Button>

              {hasMultipleCameras && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={switchCamera}
                  disabled={!isStreaming}
                  className="h-12 w-12"
                >
                  <SwitchCamera className="h-6 w-6" />
                </Button>
              )}
              {!hasMultipleCameras && <div className="h-12 w-12" />}
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={retakePhoto}
                className="h-12 w-12"
              >
                <RotateCcw className="h-6 w-6" />
              </Button>

              <Button
                size="icon"
                onClick={confirmPhoto}
                className="h-16 w-16 rounded-full bg-green-600 hover:bg-green-700"
              >
                <Check className="h-8 w-8" />
              </Button>

              <div className="h-12 w-12" />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
