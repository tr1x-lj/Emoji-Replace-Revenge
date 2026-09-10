declare const bunny: any;

const { React, common } = bunny.metro;
const { ReactNative, TableRadioGroup, TableRadioRow, Stack } = common;
const { ScrollView, View } = ReactNative;

import { clearEmojiMapCache, loadEmojiMap } from "./providers";
import { getProvider, Provider, PROVIDERS, setProvider } from "./storage";

export default function EmojiReplaceSettings() {
    const [provider, setProviderState] = React.useState<Provider>(getProvider());
    const [loading, setLoading] = React.useState(false);

    const onChange = async (value: string) => {
        setLoading(true);
        try {
            await loadEmojiMap(value as Provider);
            setProvider(value as Provider);
            setProviderState(value as Provider);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 12 }}>
            <Stack spacing={16}>
                <TableRadioGroup
                    title={loading ? "Emoji Provider (loading…)" : "Emoji Provider"}
                    value={provider}
                    onChange={onChange}
                >
                    {PROVIDERS.map((p: Provider) => (
                        <TableRadioRow key={p} label={p} value={p} />
                    ))}
                </TableRadioGroup>
            </Stack>
        </ScrollView>
    );
}
