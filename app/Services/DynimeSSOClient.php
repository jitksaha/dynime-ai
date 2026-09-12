<?php

namespace App\Services;

class DynimeSSOClient
{
    protected string $accountUrl;
    protected string $clientId;
    protected string $clientSecret;

    public function __construct(
        ?string $clientId = null,
        ?string $clientSecret = null,
        ?string $accountUrl = null
    ) {
        $this->clientId = $clientId ?: config('services.dynime_sso.client_id', 'dynime_ai_app');
        $this->clientSecret = $clientSecret ?: config('services.dynime_sso.client_secret', 'secret');
        $this->accountUrl = rtrim($accountUrl ?: config('services.dynime_sso.account_url', 'https://account.dynime.com'), '/');
    }

    public function getLoginUrl(string $redirectUri): string
    {
        return $this->accountUrl . '/login?client_id=' . urlencode($this->clientId) . '&redirect=' . urlencode($redirectUri);
    }

    public function getRegisterUrl(string $redirectUri): string
    {
        return $this->accountUrl . '/register?client_id=' . urlencode($this->clientId) . '&redirect=' . urlencode($redirectUri);
    }

    public function verifyTicket(string $ticket): ?array
    {
        $endpoint = $this->accountUrl . '/api/v1/auth/verify-ticket';

        $payload = json_encode([
            'ticket' => $ticket,
            'client_id' => $this->clientId,
        ]);

        return $this->makePostRequest($endpoint, $payload);
    }

    protected function makePostRequest(string $url, string $jsonPayload): ?array
    {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonPayload);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Accept: application/json',
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 12);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($response) {
            $data = json_decode($response, true);
            if ($httpCode >= 200 && $httpCode < 300) {
                return $data;
            }
        }

        return null;
    }
}
