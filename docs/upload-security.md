# Bezpieczne przesyłanie plików w sticker builderze

Ten dokument zbiera rekomendacje dotyczące bezpiecznego obsługiwania plików
przesyłanych przez klientów w kreatorze nalepek.

## Bieżąca implementacja

Wtyczka dodaje dwa endpointy AJAX (`wp_ajax_stb_upload_file` i
`wp_ajax_nopriv_stb_upload_file`), które:

- weryfikują `nonce` przesyłany z frontendu,
- sprawdzają rozmiar pliku względem stałej `MAX_UPLOAD_MB`,
- zezwalają wyłącznie na formaty JPG, PNG oraz PDF, sprawdzając zarówno
  rozszerzenie, jak i typ MIME przy pomocy `wp_check_filetype_and_ext()`,
- zapisują plik w katalogu `wp-content/uploads/stb/`,
- (opcjonalnie) tworzą obiekt biblioteki mediów i zwracają identyfikator,
  adres URL oraz rzeczywisty rozmiar pliku do JavaScriptu.

Frontend blokuje próby przesłania plików, które przekraczają limit lub
wykraczają poza powyższą listę typów, zanim dojdzie do wysłania żądania do
serwera. Dzięki temu ograniczamy ryzyko przepełnienia i przesłania niepożądanej
zawartości.

## Dodatkowe środki bezpieczeństwa

1. **Izolacja plików** – jeżeli chcesz trzymać uploady na osobnym serwerze,
   możesz:
   - utworzyć odseparowany host (np. subdomenę `files.example.com`) z dedykowaną
     przestrzenią na pliki,
   - wystawić ją przez SFTP/SSH, NFS lub S3/kompatybilne API (Wasabi, MinIO),
   - w WordPressie podmienić ścieżki uploadów, korzystając z filtra
     `upload_dir`, aby wskazywały na zewnętrzny zasób (np. montowany dysk NFS lub
     adapter S3 obsługiwany przez wtyczkę typu "WP Offload Media").

   Pamiętaj, że `wp_handle_upload()` operuje na lokalnym systemie plików.
   Najprościej jest więc zamontować zdalny zasób (np. poprzez SSHFS, NFS lub
   Amazon S3 + wtyczka), tak aby z punktu widzenia PHP był to zwykły katalog.

2. **Blokada wykonywania plików** – utrzymuj `.htaccess` (Apache) lub reguły
   `location` (Nginx), które blokują interpretację plików `.php`, `.phtml`,
   `.phar`, `.cgi`, `.pl`, `.asp`, `.aspx` w katalogu z uploadami. W repozytorium
   znajdziesz przykład konfiguracji w dyskusji, ale warto upewnić się, że na
   docelowym serwerze reguły zostały faktycznie wdrożone.

3. **Sprzątanie osieroconych plików** – harmonogram `wp_cron` usuwa pliki, które
   nie zostały powiązane z zamówieniem w zadanym czasie. Zapobiega to gromadzeniu
   "śmieci" w katalogu uploadów.

4. **Replikacja i kopie zapasowe** – niezależnie od miejsca przechowywania,
   utrzymuj regularne backupy i ogranicz użytkownikom WordPressa możliwość
   podmieniania plików systemowych.

## Alternatywne podejścia

- Jeżeli wolisz kompletnie oddzielić przesyłanie od WordPressa, rozważ usługę
  typu object storage (np. AWS S3, Backblaze B2) i podpisane adresy URL
  wykorzystywane przez klienta (tzw. "pre-signed URLs"). Wówczas WordPress
  jedynie otrzymuje metadane i link do pliku, a sama transmisja odbywa się bez
  udziału PHP.
- Dla plików wyjątkowo dużych można udostępnić klientom formularz, który po
  stronie serwera nadaje tymczasowy token pozwalający na wysyłkę na osobny
  serwer (np. usługa ingest w CDN). Po zakończeniu uploadu usługa zwraca ID, a
  WordPress zapisuje je w zamówieniu.

Niezależnie od wybranego wariantu, zachowaj walidację typów MIME i magicznych
liczb, monitoruj wykorzystanie przestrzeni oraz wymuszaj wymogi RODO/GDPR w
zakresie przechowywania danych klientów.
