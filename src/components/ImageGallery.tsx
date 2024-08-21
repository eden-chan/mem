import { createSignal, createEffect, For, Component } from 'solid-js';
import { listImagesFromS3, deleteFromS3 } from '../utils/s3';
import styles from './ImageGallery.module.css';

interface ImageGalleryProps {
    images: string[];
    onImageSelect: (src: string) => void;
    onImageDelete: (src: string) => void;
}

export const ImageGallery: Component<ImageGalleryProps> = (props) => {
    const handleDelete = async (img: string, event: Event) => {
        event.stopPropagation();
        await deleteFromS3(img);
        props.onImageDelete(img);
    };

    const handleImageLoad = (event: Event) => {
        const img = event.target as HTMLImageElement;
        img.style.display = 'block';
        img.nextElementSibling?.remove(); // Remove the loading spinner
    };

    const handleImageError = (event: Event) => {
        const img = event.target as HTMLImageElement;
        img.style.display = 'none';
        img.nextElementSibling?.classList.remove(styles.loadingSpinner);
        img.nextElementSibling?.classList.add(styles.errorMessage);
        // img.nextElementSibling?.textContent = 'Failed to load image';
    };

    return (
        <div class={styles.gallery}>
            <For each={props.images}>
                {(img) => (
                    <div class={styles.imageItem}>
                        <img
                            src={img}
                            alt="Gallery item"
                            onClick={() => props.onImageSelect(img)}
                            onLoad={handleImageLoad}
                            onError={handleImageError}
                            style="display: none;"
                        />
                        <div class={styles.loadingSpinner}></div>
                        <button class={styles.deleteButton} onClick={(e) => handleDelete(img, e)}>Delete</button>
                    </div>
                )}
            </For>
        </div>
    );
};