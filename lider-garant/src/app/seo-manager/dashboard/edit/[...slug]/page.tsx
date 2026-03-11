import { SeoEditorPageView } from "@/components/seo/seo-editor-page-view"

interface Props {
    params: Promise<{
        slug: string[]
    }>
}

export default async function SeoEditPage({ params }: Props) {
    const { slug } = await params

    return <SeoEditorPageView mode="edit" slugSegments={slug} />
}
