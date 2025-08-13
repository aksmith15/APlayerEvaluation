import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (req) => {
  try {
    const { ping } = await req.json();
    console.log("Received ping:", ping);
    
    if (!ping) throw new Error("Missing ping");
    
    return new Response(JSON.stringify({ 
      ok: true, 
      timestamp: new Date().toISOString(),
      received: ping 
    }), { 
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (e) {
    console.error("Function error:", e);
    return new Response(JSON.stringify({ 
      error: String(e?.message ?? e) 
    }), { 
      status: 500, 
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
});

