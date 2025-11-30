/**
 * Audio Parser Module
 * Detects and generates embed code for various audio platforms
 */

class AudioParser {
    constructor() {
        this.platforms = {
            soundcloud: {
                pattern: /(?:https?:\/\/)?(?:www\.)?soundcloud\.com\/[\w-]+\/[\w-]+/gi,
                embed: (url) => this.createSoundCloudEmbed(url)
            },
            youtube: {
                pattern: /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/gi,
                embed: (url) => this.createYouTubeEmbed(url)
            },
            spotify: {
                pattern: /(?:https?:\/\/)?(?:open\.)?spotify\.com\/(track|album|playlist)\/([\w-]+)/gi,
                embed: (url) => this.createSpotifyEmbed(url)
            },
            bandcamp: {
                pattern: /(?:https?:\/\/)?[\w-]+\.bandcamp\.com\/(?:track|album)\/([\w-]+)/gi,
                embed: (url) => this.createBandcampEmbed(url)
            },
            directAudio: {
                pattern: /https?:\/\/[^\s]+\.(?:mp3|wav|ogg|m4a|flac)/gi,
                embed: (url) => this.createDirectAudioEmbed(url)
            }
        };
    }

    /**
     * Parse text content and extract all audio URLs
     * @param {string} text - Text content to parse
     * @returns {Array} Array of detected audio objects
     */
    parseText(text) {
        const detectedAudio = [];

        for (const [platform, config] of Object.entries(this.platforms)) {
            const matches = text.matchAll(config.pattern);

            for (const match of matches) {
                detectedAudio.push({
                    platform,
                    url: match[0],
                    embedHtml: config.embed(match[0])
                });
            }
        }

        return detectedAudio;
    }

    /**
     * Create SoundCloud embed
     * @param {string} url - SoundCloud URL
     * @returns {string} Embed HTML
     */
    createSoundCloudEmbed(url) {
        const encodedUrl = encodeURIComponent(url);
        return `
      <iframe 
        width="100%" 
        height="166" 
        scrolling="no" 
        frameborder="no" 
        allow="autoplay"
        src="https://w.soundcloud.com/player/?url=${encodedUrl}&color=%238b5cf6&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false">
      </iframe>
    `;
    }

    /**
     * Create YouTube embed
     * @param {string} url - YouTube URL
     * @returns {string} Embed HTML
     */
    createYouTubeEmbed(url) {
        let videoId = '';

        // Extract video ID from different YouTube URL formats
        const patterns = [
            /(?:youtube\.com\/watch\?v=)([\w-]+)/,
            /(?:youtu\.be\/)([\w-]+)/,
            /(?:youtube\.com\/embed\/)([\w-]+)/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                videoId = match[1];
                break;
            }
        }

        if (!videoId) return '';

        return `
      <iframe 
        width="100%" 
        height="315" 
        src="https://www.youtube.com/embed/${videoId}" 
        frameborder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
        allowfullscreen>
      </iframe>
    `;
    }

    /**
     * Create Spotify embed
     * @param {string} url - Spotify URL
     * @returns {string} Embed HTML
     */
    createSpotifyEmbed(url) {
        const match = url.match(/spotify\.com\/(track|album|playlist)\/([\w-]+)/);
        if (!match) return '';

        const [, type, id] = match;
        const height = type === 'track' ? '152' : '380';

        return `
      <iframe 
        style="border-radius:12px" 
        src="https://open.spotify.com/embed/${type}/${id}?utm_source=generator" 
        width="100%" 
        height="${height}" 
        frameBorder="0" 
        allowfullscreen="" 
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
        loading="lazy">
      </iframe>
    `;
    }

    /**
     * Create Bandcamp embed
     * @param {string} url - Bandcamp URL
     * @returns {string} Embed HTML
     */
    createBandcampEmbed(url) {
        // Bandcamp embeds require album/track ID which is harder to extract
        // For now, we'll create a simple link with audio icon
        return `
      <div class="audio-link">
        <a href="${url}" target="_blank" rel="noopener noreferrer">
          🎵 Escuchar en Bandcamp
        </a>
      </div>
    `;
    }

    /**
     * Create direct audio file embed
     * @param {string} url - Direct audio file URL
     * @returns {string} Embed HTML
     */
    createDirectAudioEmbed(url) {
        return `
      <audio controls style="width: 100%;">
        <source src="${url}" type="audio/mpeg">
        Tu navegador no soporta el elemento de audio.
      </audio>
    `;
    }

    /**
     * Check if text contains any audio URLs
     * @param {string} text - Text to check
     * @returns {boolean}
     */
    hasAudioUrls(text) {
        for (const config of Object.values(this.platforms)) {
            if (config.pattern.test(text)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Get first audio URL from text
     * @param {string} text - Text to parse
     * @returns {Object|null} First detected audio or null
     */
    getFirstAudio(text) {
        const allAudio = this.parseText(text);
        return allAudio.length > 0 ? allAudio[0] : null;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioParser;
}
