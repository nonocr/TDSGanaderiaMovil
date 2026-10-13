package com.tierradesuenos.ganaderia;

import android.app.DownloadManager;
import android.content.ClipData;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.print.PrintAttributes;
import android.print.PrintManager;
import android.provider.MediaStore;
import android.util.Base64;
import android.util.Log;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebView;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.core.content.FileProvider;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.util.Arrays;
import java.util.Collections;

/**
 * Contenedor Android de TDS Ganadería: carga la web publicada (ver capacitor.config.json).
 *
 * El WebView de Android no hace solo tres cosas que la web usa y que en el navegador funcionan:
 *  1. Descargar un archivo generado en la página ("Descargar respaldo": enlace blob:).
 *  2. Descargar un archivo del servidor ("Exportar CSV": /api/exportar).
 *  3. Imprimir (window.print() en la ficha del animal).
 * Además, la foto del animal ofrece cámara O galería (Capacitor solo ofrece una de las dos).
 * Aquí se resuelven del lado nativo, sin tocar el código de la web.
 */
public class MainActivity extends BridgeActivity {

    private static final String TAG = "TDSGanaderia";
    // Solo la web de la finca puede usar el puente nativo.
    private static final String ORIGEN = "https://tdsganaderia.vercel.app";

    // Se ejecuta en cada página antes que su propio código.
    // - Recuerda los Blob creados con URL.createObjectURL para poder guardarlos cuando la página
    //   hace a.click() sobre un enlace con "download" (la página revoca la URL justo después).
    // - window.print() pasa a la impresión de Android (permite "Guardar como PDF").
    private static final String SCRIPT_PUENTE =
        "(function(){" +
        "  if (window.__tdsNativo || !window.TDSNativo) return; window.__tdsNativo = true;" +
        "  var blobs = new Map();" +
        "  var crear = URL.createObjectURL, revocar = URL.revokeObjectURL;" +
        "  URL.createObjectURL = function(o){ var u = crear.call(URL, o); if (o instanceof Blob) blobs.set(u, o); return u; };" +
        "  URL.revokeObjectURL = function(u){ blobs.delete(u); return revocar.call(URL, u); };" +
        "  var clic = HTMLAnchorElement.prototype.click;" +
        "  HTMLAnchorElement.prototype.click = function(){" +
        "    var b = this.hasAttribute('download') ? blobs.get(this.href) : null;" +
        "    if (!b) return clic.call(this);" +
        "    var nombre = this.getAttribute('download') || 'archivo';" +
        "    var r = new FileReader();" +
        "    r.onload = function(){ var s = String(r.result);" +
        "      TDSNativo.guardarArchivo(nombre, b.type || 'application/octet-stream', s.slice(s.indexOf(',') + 1)); };" +
        "    r.readAsDataURL(b);" +
        "  };" +
        "  window.print = function(){ TDSNativo.imprimir(document.title || 'TDS Ganadería'); };" +
        "})();";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WebView webView = getBridge().getWebView();

        webView.addJavascriptInterface(new PuenteNativo(webView), "TDSNativo");
        webView.setWebChromeClient(new SelectorConCamara());

        if (WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) {
            WebViewCompat.addDocumentStartJavaScript(webView, SCRIPT_PUENTE, Collections.singleton(ORIGEN));
        } else {
            Log.w(TAG, "WebView sin DOCUMENT_START_SCRIPT: descargas de respaldo e impresión no disponibles.");
        }

        // Descargas que responde el servidor (p. ej. /api/exportar → CSV). Se pasan al gestor de
        // descargas de Android con la cookie de sesión, porque esas rutas exigen sesión.
        webView.setDownloadListener((url, userAgent, contentDisposition, mimeType, contentLength) -> {
            if (!url.startsWith(ORIGEN + "/")) return;
            try {
                String nombre = URLUtil.guessFileName(url, contentDisposition, mimeType);
                DownloadManager.Request req = new DownloadManager.Request(Uri.parse(url));
                req.addRequestHeader("Cookie", CookieManager.getInstance().getCookie(url));
                req.addRequestHeader("User-Agent", userAgent);
                req.setMimeType(mimeType);
                req.setTitle(nombre);
                req.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    req.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, nombre);
                } else {
                    // Antes de Android 10, Descargas exige permiso de almacenamiento: se guarda en
                    // la carpeta de la app y se abre tocando la notificación.
                    req.setDestinationInExternalFilesDir(MainActivity.this, Environment.DIRECTORY_DOWNLOADS, nombre);
                }
                DownloadManager dm = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
                dm.enqueue(req);
                Toast.makeText(this, "Descargando " + nombre + "…", Toast.LENGTH_SHORT).show();
            } catch (Exception e) {
                Log.e(TAG, "Error al descargar", e);
                Toast.makeText(this, "No se pudo descargar el archivo.", Toast.LENGTH_LONG).show();
            }
        });
    }

    // --- Foto del animal: cámara O galería ---------------------------------------------------
    // Capacitor, para <input type="file" accept="image/*"> sin `capture`, abre solo la galería (y
    // con `capture` solo la cámara). En el navegador del celular se ofrecen las dos; aquí igual.

    private ValueCallback<Uri[]> callbackFoto;
    private Uri fotoCamara;

    private final ActivityResultLauncher<Intent> elegirFoto = registerForActivityResult(
        new ActivityResultContracts.StartActivityForResult(),
        (resultado) -> {
            if (callbackFoto == null) return;
            Uri[] elegida = null;
            if (resultado.getResultCode() == RESULT_OK) {
                Intent datos = resultado.getData();
                if (datos != null && datos.getData() != null) {
                    elegida = new Uri[] { datos.getData() }; // galería
                } else if (fotoCamara != null) {
                    elegida = new Uri[] { fotoCamara }; // cámara (escribe en EXTRA_OUTPUT)
                }
            }
            callbackFoto.onReceiveValue(elegida);
            callbackFoto = null;
        }
    );

    private class SelectorConCamara extends BridgeWebChromeClient {
        SelectorConCamara() {
            super(MainActivity.this.getBridge());
        }

        @Override
        public boolean onShowFileChooser(WebView w, ValueCallback<Uri[]> callback, FileChooserParams params) {
            boolean esImagen = Arrays.asList(params.getAcceptTypes()).contains("image/*");
            if (!esImagen || params.isCaptureEnabled()) {
                return super.onShowFileChooser(w, callback, params); // p. ej. el respaldo (.json)
            }
            if (callbackFoto != null) callbackFoto.onReceiveValue(null);
            callbackFoto = callback;

            Intent galeria = new Intent(Intent.ACTION_GET_CONTENT)
                .addCategory(Intent.CATEGORY_OPENABLE)
                .setType("image/*");
            Intent selector = Intent.createChooser(galeria, "Foto del animal");
            try {
                File archivo = new File(getCacheDir(), "foto-" + System.currentTimeMillis() + ".jpg");
                fotoCamara = FileProvider.getUriForFile(MainActivity.this, getPackageName() + ".fileprovider", archivo);
                Intent camara = new Intent(MediaStore.ACTION_IMAGE_CAPTURE)
                    .putExtra(MediaStore.EXTRA_OUTPUT, fotoCamara)
                    .addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);
                camara.setClipData(ClipData.newRawUri("", fotoCamara));
                selector.putExtra(Intent.EXTRA_INITIAL_INTENTS, new Intent[] { camara });
            } catch (Exception e) {
                Log.w(TAG, "Sin opción de cámara en el selector", e);
                fotoCamara = null;
            }
            elegirFoto.launch(selector);
            return true;
        }
    }

    /** Métodos que la página puede llamar como window.TDSNativo.*. */
    private class PuenteNativo {
        private final WebView webView;

        PuenteNativo(WebView webView) {
            this.webView = webView;
        }

        // Los métodos llegan en un hilo del WebView; la página actual solo se puede leer en el hilo
        // principal, así que se valida ahí que la llamada venga de la web de la finca.
        private void enPaginaPropia(Runnable accion) {
            runOnUiThread(() -> {
                String url = webView.getUrl();
                if (url != null && url.startsWith(ORIGEN + "/")) accion.run();
            });
        }

        @JavascriptInterface
        public void guardarArchivo(String nombre, String mime, String base64) {
            enPaginaPropia(() -> new Thread(() -> guardar(nombre, mime, base64)).start());
        }

        @JavascriptInterface
        public void imprimir(String titulo) {
            enPaginaPropia(() -> {
                PrintManager pm = (PrintManager) getSystemService(Context.PRINT_SERVICE);
                pm.print(titulo, webView.createPrintDocumentAdapter(titulo), new PrintAttributes.Builder().build());
            });
        }
    }

    // Android 10+: a la carpeta Descargas. Versiones anteriores: menú "Compartir" (Drive, WhatsApp…),
    // porque escribir en Descargas exigiría un permiso de almacenamiento.
    private void guardar(String nombre, String mime, String base64) {
        String limpio = nombre.replaceAll("[\\\\/:*?\"<>|]", "_");
        try {
            byte[] datos = Base64.decode(base64, Base64.DEFAULT);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentValues v = new ContentValues();
                v.put(MediaStore.Downloads.DISPLAY_NAME, limpio);
                v.put(MediaStore.Downloads.MIME_TYPE, mime);
                Uri uri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
                if (uri == null) throw new IllegalStateException("MediaStore devolvió null");
                try (OutputStream out = getContentResolver().openOutputStream(uri)) {
                    out.write(datos);
                }
                avisar("Guardado en Descargas: " + limpio);
            } else {
                File archivo = new File(getCacheDir(), limpio);
                try (FileOutputStream out = new FileOutputStream(archivo)) {
                    out.write(datos);
                }
                Uri uri = FileProvider.getUriForFile(this, getPackageName() + ".fileprovider", archivo);
                Intent enviar = new Intent(Intent.ACTION_SEND)
                    .setType(mime)
                    .putExtra(Intent.EXTRA_STREAM, uri)
                    .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                runOnUiThread(() -> startActivity(Intent.createChooser(enviar, "Guardar " + limpio)));
            }
        } catch (Exception e) {
            Log.e(TAG, "Error al guardar archivo", e);
            avisar("No se pudo guardar el archivo.");
        }
    }

    private void avisar(String texto) {
        runOnUiThread(() -> Toast.makeText(this, texto, Toast.LENGTH_LONG).show());
    }
}
