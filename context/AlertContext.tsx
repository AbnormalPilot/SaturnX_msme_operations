
import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import CustomAlert, { CustomAlertProps } from '../components/CustomAlert';

interface AlertOptions {
    title: string;
    message?: string;
    buttons?: CustomAlertProps['buttons'];
}

interface AlertContextType {
    showAlert: (options: AlertOptions) => void;
    hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
    const [alertConfig, setAlertConfig] = useState<CustomAlertProps>({
        visible: false,
        title: '',
        message: '',
        buttons: [],
        onDismiss: () => { },
    });

    const hideAlert = useCallback(() => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
    }, []);

    const showAlert = useCallback((options: AlertOptions) => {
        setAlertConfig({
            visible: true,
            title: options.title,
            message: options.message,
            buttons: options.buttons || [{ text: 'OK', style: 'default' }],
            onDismiss: hideAlert,
        });
    }, [hideAlert]);

    return (
        <AlertContext.Provider value={{ showAlert, hideAlert }}>
            {children}
            <CustomAlert
                {...alertConfig}
                onDismiss={hideAlert}
                visible={alertConfig.visible} // Ensure visibility is passed explicitly
            />
        </AlertContext.Provider>
    );
}

export function useAlert() {
    const context = useContext(AlertContext);
    if (context === undefined) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
}
