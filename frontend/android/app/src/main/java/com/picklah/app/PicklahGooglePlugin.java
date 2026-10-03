package com.picklah.app;

import android.content.MutableContextWrapper;
import android.os.CancellationSignal;
import androidx.core.content.ContextCompat;
import androidx.credentials.ClearCredentialStateRequest;
import androidx.credentials.CredentialManager;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.CustomCredential;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.exceptions.ClearCredentialException;
import androidx.credentials.exceptions.GetCredentialCancellationException;
import androidx.credentials.exceptions.GetCredentialException;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;

@CapacitorPlugin(name = "PicklahGoogle")
public class PicklahGooglePlugin extends Plugin {
    private CancellationSignal pending;

    @PluginMethod
    public void signIn(PluginCall call) {
        String clientId = call.getString("clientId", "");
        String nonce = call.getString("nonce", "");
        if (clientId.isEmpty() || nonce.isEmpty()) {
            call.reject("Google sign-in is not configured on the server.");
            return;
        }
        getActivity().runOnUiThread(() -> {
            if (pending != null) {
                call.reject("Google sign-in is already in progress.");
                return;
            }
            pending = new CancellationSignal();
            try {
                GetSignInWithGoogleOption option = new GetSignInWithGoogleOption.Builder(clientId)
                    .setNonce(nonce).build();
                GetCredentialRequest request = new GetCredentialRequest.Builder()
                    .addCredentialOption(option).build();
                CredentialManager.create(getContext()).getCredentialAsync(
                    new MutableContextWrapper(getActivity()), request, pending,
                    ContextCompat.getMainExecutor(getContext()),
                    new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                        @Override
                        public void onResult(GetCredentialResponse response) {
                            pending = null;
                            try {
                                if (!(response.getCredential() instanceof CustomCredential)) {
                                    call.reject("Google returned an unsupported credential.");
                                    return;
                                }
                                CustomCredential credential = (CustomCredential) response.getCredential();
                                if (!GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL.equals(credential.getType())) {
                                    call.reject("Google returned an unsupported credential.");
                                    return;
                                }
                                String token = GoogleIdTokenCredential.createFrom(credential.getData()).getIdToken();
                                JSObject result = new JSObject();
                                result.put("idToken", token);
                                call.resolve(result);
                            } catch (Exception error) {
                                call.reject("Google could not verify this account. Please try again.");
                            }
                        }
                        @Override
                        public void onError(GetCredentialException error) {
                            pending = null;
                            if (error instanceof GetCredentialCancellationException) {
                                call.reject("Google sign-in was cancelled. You can try again.", "GOOGLE_CANCELLED");
                            } else {
                                call.reject("Google sign-in failed. Check the app's Android OAuth client and signing certificate, and that Google Play services are available.", "GOOGLE_NATIVE_FAILED");
                            }
                        }
                    });
            } catch (Exception error) {
                pending = null;
                call.reject("Google sign-in could not start. Please try again.");
            }
        });
    }

    @PluginMethod
    public void signOut(PluginCall call) {
        CredentialManager.create(getContext()).clearCredentialStateAsync(
            new ClearCredentialStateRequest(), null, ContextCompat.getMainExecutor(getContext()),
            new CredentialManagerCallback<Void, ClearCredentialException>() {
                @Override public void onResult(Void result) { call.resolve(); }
                @Override public void onError(ClearCredentialException error) { call.reject("Could not clear Google account selection."); }
            });
    }

    @Override
    protected void handleOnDestroy() {
        if (pending != null) { pending.cancel(); pending = null; }
    }
}
