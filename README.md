# Space Shooter

2019'da Unity eğitim projesi olarak yaptığım uzay oyununun 3B kokpit sürümü. Pilot koltuğundan ileri bakarsın; düşmanlar, asteroitler, mayınlar, bosslar ve mermiler derinlikten üzerine gelir.

## Çalıştırma

Statik bir sunucudan aç (dosyalar `fetch` ile yüklenir):

    python3 -m http.server 8772

Bütün yollar görelidir, oyun bir alt klasörden de çalışır.

## Kontroller

- Klavye: yön tuşları ya da WASD ile uç, Boşluk ile ateş et, X ile Nova, P ile duraklat, M ile ses
- Fare: nişangâh imleci izler, sol tuş ateş, sağ tuş Nova
- Dokunmatik: parmağını sürükle, gemi kendi ateş eder, Nova sağ altta

## Varlık hattı

Bütün modeller, dokular ve animasyonlar Blender 5.3 ile `tools/` içindeki betiklerden üretilip `assets/` altına yazılır. Oyun sırasında geometri ya da doku üretilmez.

    blender --background --python tools/bake_models.py
    blender --background --python tools/bake_textures.py
    python3 tools/check_assets.py --table

`check_assets.py` şu durumlarda hata verir: bir modelin en yakın LOD'u 1.000 üçgenin altındaysa, animasyonlu bir modelin armature'ı 24 bone'dan azsa ya da hareket etmeyen bir bone varsa.

`?debug=1` yalnız test kancalarını açar.
