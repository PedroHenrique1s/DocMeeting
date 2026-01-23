export interface ModalButton {
    label: string;
    cssClass?: string;
    action: () => void;
}

export interface ModalConfig {
    title: string;
    message: string;
    buttons: ModalButton[];
}
