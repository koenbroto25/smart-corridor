import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "url required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // YouTube oEmbed
    if (/youtube\.com|youtu\.be/i.test(url)) {
      const o = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
      const data = await o.json().catch(() => ({}));
      const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
      const embedUrl = m ? `https://www.youtube.com/embed/${m[1]}` : null;
      return new Response(
        JSON.stringify({
          title: data.title,
          description: "",
          image: data.thumbnail_url,
          siteName: "YouTube",
          embedUrl,
          url,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Vimeo oEmbed
    if (/vimeo\.com/i.test(url)) {
      const o = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`);
      const data = await o.json().catch(() => ({}));
      const m = url.match(/vimeo\.com\/(\d+)/);
      const embedUrl = m ? `https://player.vimeo.com/video/${m[1]}` : null;
      return new Response(
        JSON.stringify({
          title: data.title,
          description: data.description || "",
          image: data.thumbnail_url,
          siteName: "Vimeo",
          embedUrl,
          url,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const res = await fetch(url, { redirect: "follow" });
    const html = await res.text();
    const getMeta = (name: string) => {
      const m = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']*)["']`, "i"))
        || html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${name}["']`, "i"));
      return m ? m[1] : null;
    };
    const title = getMeta("og:title") || (html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? null);
    const description = getMeta("og:description") || getMeta("description");
    const image = getMeta("og:image");
    const siteName = getMeta("og:site_name");
    return new Response(
      JSON.stringify({ title, description, image, siteName, url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});