import { toast } from "@/hooks/use-toast"

export const showSuccessToast = (title: string, description?: string) => {
    toast({
        title,
        description,
        variant: "default",
        duration: 3000,
    })
}

export const showErrorToast = (title: string, description?: string) => {
    toast({
        title,
        description,
        variant: "destructive",
        duration: 5000,
    })
}

export const showInfoToast = (title: string, description?: string) => {
    toast({
        title,
        description,
        variant: "default",
        duration: 4000,
    })
}

export const showWarningToast = (title: string, description?: string) => {
    toast({
        title: `⚠️ ${title}`,
        description,
        variant: "default",
        duration: 4000,
    })
}

export const showLoadingToast = (title: string, description?: string) => {
    return toast({
        title: `⏳ ${title}`,
        description,
        variant: "default",
        duration: Infinity,
    })
}

