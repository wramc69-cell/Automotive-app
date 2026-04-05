import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './Card';
import { Button } from './Button';
import { X } from 'lucide-react';

interface TermsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function TermsModal({ isOpen, onClose }: TermsModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in">
            <Card className="w-full max-w-2xl bg-white shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-black transition-colors"
                >
                    <X size={24} />
                </button>
                <CardHeader>
                    <CardTitle className="text-xl">Términos y Condiciones de Servicio</CardTitle>
                </CardHeader>
                <CardContent className="max-h-[60vh] overflow-y-auto space-y-4 text-sm text-slate-600 leading-relaxed pr-2">
                    <p className="font-bold">1. Diagnóstico y Estimaciones:</p>
                    <p>
                        Las estimaciones proporcionadas por Denver Mobile Auto Care son aproximadas y están basadas en el diagnóstico
                        inicial del técnico. Si durante la reparación se detectan fallas adicionales que requieran cambio en el presupuesto,
                        se notificará al cliente antes de proceder.
                    </p>

                    <p className="font-bold">2. Refacciones y Garantía:</p>
                    <p>
                        Denver Mobile Auto Care ofrece garantía de 3 meses o 3,000 millas en mano de obra.
                        Las piezas externas están sujetas a la garantía del fabricante. Si el cliente suministra sus propias piezas,
                        no hay garantía aplicable por fallas de las mismas.
                    </p>

                    <p className="font-bold">3. Descuento de Visit Fee:</p>
                    <p>
                        Al aprobar una cotización de reparación mayor a $150.00, se aplicará un descuento de $30.00 correspondiente a
                        la tarifa de visita inicial (visit_fee).
                    </p>

                    <p className="font-bold">4. Pago:</p>
                    <p>
                        El pago total es requerido al momento de finalizar el trabajo. Aceptamos tarjetas de crédito/débito,
                        o pagos electrónicos coordinados con el técnico.
                    </p>

                    <p className="font-bold">5. Autorización:</p>
                    <p>
                        Al firmar digitalmente, usted autoriza a nuestros técnicos a operar su vehículo para propósitos de prueba,
                        inspección y entrega.
                    </p>
                </CardContent>
                <CardFooter className="flex justify-end pt-6">
                    <Button onClick={onClose} variant="primary">Entendido</Button>
                </CardFooter>
            </Card>
        </div>
    );
}
