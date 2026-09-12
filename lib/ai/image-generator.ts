import fs from 'fs';
import path from 'path';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

/**
 * Editorial Photography Prompt Guardrails
 * Strictly prevents the "AI generated look" (no plastic skin, no neon bloom, no CGI).
 * Emulates authentic 35mm Leica film, Kinfolk / Architectural Digest / Cereal magazine aesthetics.
 */
const BRAND_PHOTOGRAPHY_DIRECTIVE = `Editorial still life and architectural photography for Nothingness luxury sanctuary, shot on 35mm Leica M11 with 50mm f/1.4 lens. Natural chiaroscuro ambient lighting, 2200K amber glow and deep soft shadows, muted earthy palette with board-formed concrete, dark walnut, raw linen, natural stone, and unpolished brass. Tactile authentic textures, candid unstaged composition, subtle natural film grain. Real photograph, zero CGI, zero 3D render, zero plastic skin, zero oversaturated neon, zero fantasy bloom, zero cheesy stock imagery.`;

/**
 * Curated context-specific scene blueprints for established article topics
 */
export const CONTEXTUAL_TOPIC_SCENES: Record<string, string> = {
  'power-dynamics': 'Atmospheric editorial lifestyle photography, intimate and gentle, two hands intertwined resting on dark charcoal textured raw linen sheets, soft morning natural window light from the side, chiaroscuro shadow play, serene emotional trust and vulnerability, minimalist luxury brutalist bedroom',
  'shibari': 'Atmospheric editorial still life photography of authentic 6mm golden Japanese jute rope carefully coiled on an artisanal dark slate tray with EMT trauma shears, soft 2200K amber side-lighting, tactile rope fiber texture, cast concrete background',
  'high-rise': 'Cinematic moody nighttime interior photography of an ultra-luxury South Delhi penthouse living room, floor-to-ceiling glass window with twinkling bokeh city lights in background, two delicate crystal tumblers on a dark polished marble table, warm ambient 2200K brass cove lighting, intimate quiet vulnerability',
  'community': 'Architectural interior photography of an exclusive intimate literary salon lounge in urban India, dark smoked oak bookshelves, comfortable low linen chairs, soft amber uplighting, warm shadows, serene community atmosphere, Kinfolk luxury aesthetic',
  'impact-play': 'Editorial still life photography of handcrafted supple black leather and dark suede sensory implements meticulously organized on an artisanal weathered timber bench, directional natural daylight from high window, rich tactile leather grain, architectural brutalist concrete backdrop',
  'vulnerability': 'Atmospheric architectural photography of a thoughtful silhouette of a person standing quietly in a brutalist concrete corridor looking into a private courtyard garden with bamboo, dramatic raking side daylight, deep shadows, emotional presence, serene dignity',
  'praise-kink': 'Kinfolk editorial still life photography of an open vintage brass fountain pen resting on a dark embossed leather-bound journal with subtle handwritten notes, a small ceramic vase with a single branch, placed on raw textured linen tablecloth, soft morning window light, intimate emotional resonance',
  'alias': 'Film noir luxury editorial still life photography of an artisanal matte black mask and a vintage heavy brass key resting on a dark slate cafe table beside an espresso cup, dramatic chiaroscuro angled sunlight, high-end privacy and discreet mystery',
  'blindfolds': 'Sensory still-life editorial photography of an exquisite weighted black mulberry silk blindfold and a small handcrafted ceramic pitcher of warm soy massage wax, soft warm candle glow, resting on a dark textured slate platter, tactile luxury',
  'aftercare': 'Warm somatic comfort editorial photography, a thick waffle-weave heavy organic wool blanket draped over a minimalist low platform bed, a steaming handcrafted earthenware mug of chamomile tea on a bedside cast concrete block, soft warm 2200K morning glow, emotional soothing and somatic grounding',
  'roleplay': 'Cinematic moody interior photography of an intimate hotel lounge bar counter, two elegant coupe glasses with amber cocktails, a discreet brass hotel room key with vintage tassel resting on polished dark walnut, warm sultry 2200K ambient lighting, quiet playful mystery between partners',
  'negotiating': 'Candid morning editorial lifestyle photography of two artisanal ceramic coffee cups and an open linen-covered notebook with handwritten notes on a sun-dappled solid oak cafe table, soft warm morning sunlight, peaceful transparency and honest conversation between partners, Kinfolk aesthetic',
  'arranged-marriage': 'Architectural photography blending heritage and contemporary luxury in Bangalore, a delicate handcrafted brass incense burner emitting a thin curl of fragrant smoke in a ray of sunlight against modern cast concrete and dark teak louvers, spiritual transition and authentic intimacy',
  'polyamory': 'Serene lifestyle editorial photography of three handcrafted artisanal ceramic cups arranged in a harmonious relaxed circle on a low volcanic stone table in a secluded lush tropical courtyard, dappled afternoon shadows, open honest dialogue',
  'guilt-shame': 'Evocative minimalist architectural photography, a dramatic single ray of warm daylight breaking through a slit in dark cast concrete walls, illuminating a smooth black river stone resting on raw ivory linen, symbolic shedding of shame, profound peace',
  'ritual': 'Editorial still life of a sacred sensory evening ritual, a natural beeswax candle glowing softly on a dark basalt tray, a bundle of dried botanicals, and an amber glass dropper bottle of infused botanical oil, peaceful meditative sanctuary, warm golden chiaroscuro',
  'five-star': 'Architectural Digest exterior photography of a private luxury brutalist sanctuary retreat entrance, monolithic dark rammed earth wall with warm recessed uplighting, secluded lush tropical courtyard foliage at dusk, discreet architectural haven',
  'assagao': 'Lush tranquil veranda in Assagao Goa, weathered laterite stone arches opening to tropical palm trees swaying in a gentle breeze, a low teak daybed with raw linen cushions, warm dappled Goan afternoon sunlight, peaceful retreat',
  'sensory-deprivation': 'Architectural photography of a monolithic dark basalt stone soaking bath in a minimalist brutalist cavernous sanctuary bathroom, calm tranquil water, soft rising steam, a single dramatic beam of morning light illuminating the textured dark stone wall, serene stillness',
  'architecture-of-seduction': 'Museum-grade architectural photography of an ultra-luxury brutalist sanctuary interior, board-formed cast concrete walls intersecting with smoked dark oak floorboards, a sculptural beam of natural daylight raking across the raw texture, zero clutter, deep spatial stillness',
  'acoustic-isolation': 'Architectural detail interior photography of ultra-heavy deep charcoal wool acoustic drapery with rich woven tactile texture, partially framing a dark steel-framed window overlooking a tranquil bamboo garden in mist and gentle rain, completely silent serene atmosphere, brutalist concrete wall',
  'soundscapes': 'High-end analog soundscape photography, a sleek minimalist matte black turntable with a spinning vinyl record, the warm golden amber glow of a vacuum tube amplifier on a dark walnut credenza against cast concrete, sensory immersion',
  'bdsm-hardware': 'Architectural detail photography of a custom blackened steel structural load-bearing beam recessed flush into a board-formed concrete ceiling, paired with a minimalist handcrafted dark leather bench in an ultra-luxury private sanctuary, refined design',
  'sensory-dungeon-kit': 'Exquisite still life photography of an open bespoke matte black leather travel case revealing finely organized tactile sensory implements, dark mulberry silk, frosted glass wand, and small amber vials, resting on dark Belgian linen, discreet luxury',
  '2200k': 'Architectural interior photography of a dark brutalist sanctuary bedroom at dusk, an incandescent 2200K amber filament bulb glowing warmly beside a dark textured board-formed concrete wall, casting gentle golden light over tumbled linen bedding, deep moody shadows, ultra-atmospheric',
  'surveillance': 'Moody architectural perspective looking through sheer dark linen curtains of a private high-rise sanctuary toward distant metropolitan city lights at twilight, peaceful darkened interior offering total privacy from urban surveillance',
  'keyless': 'Architectural detail photography of a sleek minimalist matte black biometric digital keyless entry lock on a heavy solid dark teak portal, subtle glowing amber keypad in the darkness, secure discreet autonomous entry',
  'digital-hygiene': 'Minimalist editorial still-life photography of a sleek matte black smartphone resting face-down beside a solid architectural brass key and a small hardware security key on a polished cold terrazzo tabletop, dramatic low angled sunlight casting long sharp shadows, moody high-end discretion',
  'joint-family': 'Kinfolk editorial morning photography of a private sanctuary villa bedroom, an unmade low bed with rumpled ivory Belgian linen sheets, a handcrafted wooden breakfast tray with two ceramic coffee mugs, warm morning light streaming through sheer curtains blowing in a soft breeze, profound peace and quiet relief',
  'handbook': 'Architectural Digest editorial still life photography of an elegant embossed dark leather document folio, a solid vintage brass fountain pen, and a folded architectural blueprint on a dark solid walnut desk, warm 2200K brass reading desk lamp glowing softly, moody shadows, peaceful discretion and authority',
};

/**
 * Builds a nuanced, non-AI-looking editorial photography prompt tailored to the article.
 */
export function buildContextualPrompt(article: {
  title: string;
  slug?: string;
  category?: string;
  excerpt?: string;
  tags?: string[];
  customPrompt?: string;
}): string {
  if (article.customPrompt && article.customPrompt.trim()) {
    return `${article.customPrompt.trim()}. ${BRAND_PHOTOGRAPHY_DIRECTIVE}`;
  }

  const textToSearch = `${article.slug || ''} ${article.title} ${article.excerpt || ''} ${(article.tags || []).join(' ')}`.toLowerCase();

  // 1. Match specific topic scenes
  for (const [key, scene] of Object.entries(CONTEXTUAL_TOPIC_SCENES)) {
    if (textToSearch.includes(key)) {
      return `${scene}, ${BRAND_PHOTOGRAPHY_DIRECTIVE}`;
    }
  }

  // 2. Fallback to category-based architectural & editorial compositions
  const category = article.category || '';
  let categoryScene = 'Atmospheric architectural and interior still-life photography inside an ultra-luxury private sanctuary';

  if (category.includes('Dynamics') || category.includes('Kink')) {
    categoryScene = 'Tactile editorial still life of artisanal handcrafted leather and raw jute fiber on dark slate, warm 2200K amber chiaroscuro lighting, quiet psychological intimacy';
  } else if (category.includes('Intimacy') || category.includes('Relationship')) {
    categoryScene = 'Candid emotional stillness, two ceramic cups and an open handwritten journal on a sunlit weathered oak table beside crumpled linen, soft morning shadows';
  } else if (category.includes('Sensory') || category.includes('Space')) {
    categoryScene = 'Minimalist brutalist architecture, monolithic raw concrete wall with a single sculptural slit of daylight falling onto a dark stone soaking tub with rising steam';
  } else if (category.includes('Discretion') || category.includes('Safe Havens')) {
    categoryScene = 'High-end architectural discretion, solid dark teak portal with a matte black biometric lock, heavy acoustic drapery, secluded unmonitored sanctuary';
  }

  return `${categoryScene}. Context: "${article.title}". ${BRAND_PHOTOGRAPHY_DIRECTIVE}`;
}

/**
 * Generates an image buffer using Google GenAI (Imagen 3) or FLUX with watermark stripping.
 */
export async function generateImageBuffer(prompt: string, seed: number = Date.now() % 10000): Promise<Buffer> {
  // 1. Try Google GenAI Imagen 3 if key is configured
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const resp = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt,
        config: {
          numberOfImages: 1,
          aspectRatio: '16:9',
          outputMimeType: 'image/jpeg',
        },
      });

      const base64Image = resp.generatedImages?.[0]?.image?.imageBytes;
      if (base64Image) {
        return Buffer.from(base64Image, 'base64');
      }
    } catch (geminiErr: any) {
      console.warn('[Image Generator] Gemini Imagen 3 error, falling back to FLUX:', geminiErr?.message);
    }
  }

  // 2. High-speed FLUX.1 Engine with clean watermark removal
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1200&height=675&model=flux&nologo=true&seed=${seed}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`FLUX image generation API returned ${response.status}`);
  }

  const rawBuffer = Buffer.from(await response.arrayBuffer());
  if (rawBuffer.length < 5000) {
    throw new Error('Received invalid/corrupt image buffer');
  }

  // Strip any bottom watermark (36px) and resize with Lanczos3 if sharp is available
  try {
    const sharpModule = await import('sharp');
    const sharp = sharpModule.default || sharpModule;
    const meta = await sharp(rawBuffer).metadata();
    const cropHeight = Math.max(100, (meta.height || 675) - 36);

    return await sharp(rawBuffer)
      .extract({ left: 0, top: 0, width: meta.width || 1200, height: cropHeight })
      .resize(1200, 675, { fit: 'cover' })
      .jpeg({ quality: 92, progressive: true })
      .toBuffer();
  } catch (sharpErr) {
    console.warn('[Image Generator] Sharp processing skipped or unavailable, using raw buffer:', sharpErr);
    return rawBuffer;
  }
}

/**
 * Saves generated image to local public directory and uploads to Supabase storage if available.
 */
export async function persistJournalImage(slug: string, buffer: Buffer): Promise<{ localPath: string; publicUrl: string }> {
  const localRelativePath = `/images/journal/${slug}.jpg`;
  
  // 1. Write to local filesystem if accessible
  try {
    const publicDir = path.join(process.cwd(), 'public/images/journal');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    const fullLocalPath = path.join(publicDir, `${slug}.jpg`);
    fs.writeFileSync(fullLocalPath, buffer);
  } catch (fsErr) {
    console.warn('[Image Generator] Could not write to local filesystem (likely read-only serverless environment):', fsErr);
  }

  let finalUrl = localRelativePath;

  // 2. Upload to Supabase Storage 'journal' bucket for permanent cloud CDN delivery
  try {
    const supabase = createAdminClient();
    const { error: uploadError } = await supabase.storage.from('journal').upload(`${slug}.jpg`, buffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });

    if (!uploadError) {
      const { data } = supabase.storage.from('journal').getPublicUrl(`${slug}.jpg`);
      if (data?.publicUrl) {
        finalUrl = data.publicUrl;
      }
    }
  } catch (storageErr) {
    console.warn('[Image Generator] Supabase storage upload optional fallback notice:', storageErr);
  }

  return {
    localPath: localRelativePath,
    publicUrl: finalUrl,
  };
}

/**
 * Generates a context-aware editorial image for a single article and updates Supabase.
 */
export async function generateContextualImageForArticle(
  articleIdentifier: string,
  options: { customPrompt?: string } = {}
): Promise<{ success: boolean; cover_image?: string; error?: string }> {
  try {
    const supabase = createAdminClient();

    // Fetch article by ID or slug
    let query = supabase.from('articles').select('*');
    if (articleIdentifier.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      query = query.eq('id', articleIdentifier);
    } else {
      query = query.eq('slug', articleIdentifier);
    }

    const { data: article, error } = await query.single();
    if (error || !article) {
      throw new Error(`Article "${articleIdentifier}" not found in database.`);
    }

    const prompt = buildContextualPrompt({
      title: article.title,
      slug: article.slug,
      category: article.category,
      excerpt: article.excerpt,
      tags: article.tags,
      customPrompt: options.customPrompt,
    });

    const buffer = await generateImageBuffer(prompt);
    const { localPath, publicUrl } = await persistJournalImage(article.slug, buffer);

    // Update database record
    const coverToSet = fs.existsSync(path.join(process.cwd(), 'public/images/journal', `${article.slug}.jpg`))
      ? localPath
      : publicUrl;

    const { error: updateError } = await supabase
      .from('articles')
      .update({
        cover_image: coverToSet,
        updated_at: new Date().toISOString(),
      })
      .eq('id', article.id);

    if (updateError) {
      throw updateError;
    }

    revalidatePath('/journal');
    revalidatePath(`/journal/${article.slug}`);
    revalidatePath('/admin/journal');

    return {
      success: true,
      cover_image: coverToSet,
    };
  } catch (err: any) {
    console.error('[Image Generator] Failed to generate article image:', err);
    return {
      success: false,
      error: err.message || 'Image generation failed',
    };
  }
}

/**
 * Batch generates contextual images for all articles.
 */
export async function generateContextualImagesForAllArticles(
  options: { onlyRoomImages?: boolean; forceRegenerate?: boolean } = {}
): Promise<{
  success: boolean;
  total: number;
  updated: number;
  failed: number;
  details: Array<{ slug: string; title: string; success: boolean; cover_image?: string; error?: string }>;
}> {
  try {
    const supabase = createAdminClient();
    const { data: articles, error } = await supabase
      .from('articles')
      .select('id, slug, title, category, excerpt, tags, cover_image')
      .order('created_at', { ascending: false });

    if (error || !articles) {
      throw new Error(`Could not fetch articles: ${error?.message}`);
    }

    const targetArticles = options.onlyRoomImages
      ? articles.filter((a) => {
          const img = a.cover_image || '';
          return img.includes('The Void') || img.includes('IMG_') || img.includes('DAFF28CA');
        })
      : articles;

    const results: Array<{ slug: string; title: string; success: boolean; cover_image?: string; error?: string }> = [];
    let updatedCount = 0;
    let failedCount = 0;

    for (const article of targetArticles) {
      try {
        const localImgPath = path.join(process.cwd(), 'public/images/journal', `${article.slug}.jpg`);
        const localRelative = `/images/journal/${article.slug}.jpg`;

        if (!options.forceRegenerate && fs.existsSync(localImgPath)) {
          // Local asset already exists, link it in database
          await supabase
            .from('articles')
            .update({
              cover_image: localRelative,
              updated_at: new Date().toISOString(),
            })
            .eq('id', article.id);

          results.push({
            slug: article.slug,
            title: article.title,
            success: true,
            cover_image: localRelative,
          });
          updatedCount++;
          continue;
        }

        // Generate newly
        const prompt = buildContextualPrompt(article);
        const buffer = await generateImageBuffer(prompt);
        const { localPath, publicUrl } = await persistJournalImage(article.slug, buffer);

        const coverToSet = fs.existsSync(localImgPath) ? localPath : publicUrl;

        await supabase
          .from('articles')
          .update({
            cover_image: coverToSet,
            updated_at: new Date().toISOString(),
          })
          .eq('id', article.id);

        results.push({
          slug: article.slug,
          title: article.title,
          success: true,
          cover_image: coverToSet,
        });
        updatedCount++;
      } catch (itemErr: any) {
        console.error(`Failed generation for ${article.slug}:`, itemErr);
        results.push({
          slug: article.slug,
          title: article.title,
          success: false,
          error: itemErr.message,
        });
        failedCount++;
      }
    }

    revalidatePath('/journal');
    revalidatePath('/admin/journal');

    return {
      success: true,
      total: targetArticles.length,
      updated: updatedCount,
      failed: failedCount,
      details: results,
    };
  } catch (err: any) {
    console.error('[Image Generator] Batch generation error:', err);
    return {
      success: false,
      total: 0,
      updated: 0,
      failed: 0,
      details: [],
    };
  }
}
