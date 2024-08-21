import { createSignal, Show } from 'solid-js';
import { uploadToS3 } from '../utils/s3';
import styles from './FileUploader.module.css';

interface FileUploaderProps {
    onUploadSuccess: (url: string) => void;
}

export function FileUploader(props: FileUploaderProps) {
    const [selectedFile, setSelectedFile] = createSignal<File | null>(null);
    const [isUploading, setIsUploading] = createSignal(false);

    const handleFileChange = (event: Event) => {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            setSelectedFile(input.files[0]);
        }
    };

    const handleUpload = async () => {
        if (selectedFile()) {
            setIsUploading(true);
            const url = await uploadToS3(selectedFile()!);
            setIsUploading(false);
            if (url) {
                props.onUploadSuccess(url);
                setSelectedFile(null);
            }
        }
    };

    return (
        <div class={styles.fileUploader}>
            <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                class={styles.fileInput}
            />
            <Show when={selectedFile()}>
                <div class={styles.fileInfo}>
                    <span>{selectedFile()?.name}</span>
                    <button
                        onClick={handleUpload}
                        disabled={isUploading()}
                        class={styles.uploadButton}
                    >
                        {isUploading() ? 'Uploading...' : 'Confirm Upload'}
                    </button>
                </div>
            </Show>
        </div>
    );
}