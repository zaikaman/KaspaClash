import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface WalletConnectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConnect: (walletType: string) => void;
}

export default function WalletConnectModal({ isOpen, onClose, onConnect }: WalletConnectModalProps) {
    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile device
    useEffect(() => {
        const checkMobile = () => {
            const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
            const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
            const isMobileDevice = mobileRegex.test(userAgent.toLowerCase());
            const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            const isSmallScreen = window.innerWidth <= 768;
            
            setIsMobile(isMobileDevice || (isTouchDevice && isSmallScreen));
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-cyber-black/90 border border-cyber-gold/50 backdrop-blur-xl text-white font-orbitron max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold bg-gradient-cyber bg-clip-text text-transparent text-center">
                        Connect Wallet
                    </DialogTitle>
                    <DialogDescription className="text-cyber-gray text-center font-montserrat">
                        {isMobile ? "Desktop Required" : "Choose a wallet to enter the arena."}
                    </DialogDescription>
                </DialogHeader>

                {isMobile ? (
                    // Mobile-specific message
                    <div className="text-center py-8 space-y-4">
                        <div className="text-5xl mb-4">🖥️</div>
                        <div className="space-y-2">
                            <p className="font-medium text-lg text-cyber-gold">
                                Kasware is Only for Desktop Users
                            </p>
                            <p className="text-cyber-gray font-montserrat text-sm">
                                To connect your wallet and play KaspaClash, please access the game from your computer.
                            </p>
                        </div>
                        <div className="rounded-lg bg-black/40 border border-cyber-gold/20 p-4 mt-6">
                            <p className="text-xs text-cyber-gray font-montserrat">
                                Kasware wallet extension is only available on desktop browsers.
                                Visit{" "}
                                <a
                                    href="https://kasware.xyz"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-cyber-gold hover:text-cyber-orange transition-colors font-medium"
                                >
                                    kasware.xyz
                                </a>
                                {" "}on your computer to get started.
                            </p>
                        </div>
                    </div>
                ) : (
                    // Desktop wallet selection
                    <>
                        <div className="flex flex-col gap-4 mt-6">
                            {/* Kasware Wallet */}
                            <Button
                                onClick={() => onConnect("kasware")}
                                className="h-16 bg-black/40 border border-cyber-gold/30 hover:border-cyber-gold hover:bg-cyber-gold/10 flex items-center justify-between px-6 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    {/* Placeholder Icon */}
                                    <div className="w-8 h-8 rounded-full bg-cyber-orange/20 flex items-center justify-center">
                                        <span className="text-cyber-orange text-lg">K</span>
                                    </div>
                                    <span className="text-lg font-medium text-white group-hover:text-cyber-gold transition-colors">Kasware</span>
                                </div>
                                <span className="text-cyber-gray text-xs group-hover:text-white transition-colors">Recommended</span>
                            </Button>
                        </div>

                        <div className="mt-4 text-center">
                            <p className="text-xs text-cyber-gray font-montserrat">
                                By connecting, you agree to our Terms of Service.
                            </p>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
