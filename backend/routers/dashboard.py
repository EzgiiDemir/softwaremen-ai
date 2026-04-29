import json
from fastapi import APIRouter, HTTPException, Header
from services.auth_service import get_current_user
from services.ai_service import client
from config import GROQ_MODEL
from db import stockman, financeman, accountman, serviceman, wageman

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

_MODUL_OZET = {
    "stockman":   stockman.get_stok_ozet,
    "financeman": financeman.get_finans_ozet,
    "accountman": accountman.get_muhasebe_ozet,
    "serviceman": serviceman.get_servis_ozet,
    "wageman":    wageman.get_personel_ozet,
}


@router.get("/ozet")
def ozet(authorization: str | None = Header(None)):
    payload = get_current_user(authorization)
    moduller = payload.get("moduller", [])

    sonuc: dict = {}
    hatalar: dict = {}
    for modul, fn in _MODUL_OZET.items():
        if modul in moduller:
            try:
                sonuc[modul] = fn()
            except Exception as e:
                hatalar[modul] = str(e)

    return {
        "kullanici": payload.get("ad"),
        "moduller": moduller,
        "ozet": sonuc,
        **({"hatalar": hatalar} if hatalar else {}),
    }


@router.get("/bildirimler")
def bildirimler(authorization: str | None = Header(None)):
    payload = get_current_user(authorization)
    moduller = payload.get("moduller", [])

    veri: dict = {}
    for modul, fn in _MODUL_OZET.items():
        if modul in moduller:
            try:
                veri[modul] = fn()
            except Exception as e:
                veri[modul] = {"hata": str(e)}

    prompt = f"""Sen Softwaremen ERP sisteminin bildirim motorusun.
Kullanıcı: {payload.get('ad')}
Erişim izinli modüller: {moduller}

Aşağıdaki modül verilerini analiz et, kritik durumları tespit et.
Veri:
{json.dumps(veri, ensure_ascii=False, default=str)}

Yanıtı SADECE geçerli JSON dizisi olarak ver:
[
  {{"tip": "kritik", "modul": "modül_adı", "mesaj": "Türkçe bildirim mesajı"}},
  {{"tip": "uyari",  "modul": "modül_adı", "mesaj": "Türkçe bildirim mesajı"}},
  {{"tip": "bilgi",  "modul": "modül_adı", "mesaj": "Türkçe bildirim mesajı"}}
]

tip: "kritik" (kırmızı), "uyari" (sarı), "bilgi" (mavi)
Sadece gerçekten önemli 5-8 bildirim üret. Başka hiçbir şey yazma."""

    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
        )
        icerik = response.choices[0].message.content.strip()
        if "```" in icerik:
            icerik = icerik.split("```")[1]
            if icerik.startswith("json"):
                icerik = icerik[4:]
            icerik = icerik.strip()
        return {"bildirimler": json.loads(icerik)}
    except json.JSONDecodeError:
        return {"bildirimler": [], "hata": "JSON parse hatası"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
