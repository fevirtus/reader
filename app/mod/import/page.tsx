import { ImportBatchClient } from "./import-batch-client"
import { ImportClient } from "./import-client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ModImportPage() {
  return (
    <Tabs defaultValue="single" className="w-full">
      <TabsList className="mx-4 mt-4 md:mx-6">
        <TabsTrigger value="single">Một EPUB</TabsTrigger>
        <TabsTrigger value="batch">Nhiều EPUB (tự động)</TabsTrigger>
      </TabsList>
      <TabsContent value="single" className="mt-0">
        <ImportClient />
      </TabsContent>
      <TabsContent value="batch" className="mt-0">
        <ImportBatchClient />
      </TabsContent>
    </Tabs>
  )
}
