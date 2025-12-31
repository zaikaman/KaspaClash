import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface WalletConnectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConnect: (walletType: string) => void;
}

export default function WalletConnectModal({ isOpen, onClose, onConnect }: WalletConnectModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-cyber-black/90 border border-cyber-gold/50 backdrop-blur-xl text-white font-orbitron max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold bg-gradient-cyber bg-clip-text text-transparent text-center">
                        Connect Wallet
                    </DialogTitle>
                    <DialogDescription className="text-cyber-gray text-center font-montserrat">
                        Choose a wallet to enter the arena.
                    </DialogDescription>
                </DialogHeader>

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

                    {/* Kaspium Wallet */}
                    <Button
                        onClick={() => onConnect("kaspium")}
                        className="h-16 bg-black/40 border border-cyber-gold/30 hover:border-cyber-gold hover:bg-cyber-gold/10 flex items-center justify-between px-6 transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            {/* Placeholder Icon */}
                            <div className="w-8 h-8 rounded-full bg-cyber-blue/20 flex items-center justify-center">
                                <span className="text-cyber-blue text-lg">M</span>
                            </div>
                            <span className="text-lg font-medium text-white group-hover:text-cyber-gold transition-colors">Kaspium</span>
                        </div>
                        <span className="text-cyber-gray text-xs group-hover:text-white transition-colors">Mobile</span>
                    </Button>
                </div>

                <div className="mt-4 text-center">
                    <p className="text-xs text-cyber-gray font-montserrat">
                        By connecting, you agree to our Terms of Service.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
