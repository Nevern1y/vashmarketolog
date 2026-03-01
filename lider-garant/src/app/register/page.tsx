"use client";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import LottieHero from "@/components/LottieHero";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { registerApi, type RegisterData } from "@/api/auth";

const schema = z.object({
  name: z.string().min(2, "Минимум 2 символа"),
  email: z.string().email("Введите корректный email"),
  password: z.string().min(6, "Минимум 6 символов"),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await registerApi(values as RegisterData);
      if (result.success) {
        toast.success("Регистрация успешна!", { 
          description: "Войдите в систему для продолжения" 
        });
        router.push("/login");
      } else {
        setError(result.message || "Ошибка регистрации");
      }
    } catch (err) {
      setError("Произошла ошибка при регистрации");
    } finally {
      setIsLoading(false);
    }
  };

  const [show, setShow] = useState(false);

  return (
    <main className="mx-auto w-full max-w-5xl px-6 pt-16 pb-12 md:pt-24 md:pb-16">
      <Card className="border border-foreground/10 bg-background/90 backdrop-blur-xl shadow-2xl transition-all hover:shadow-3xl">
        <CardContent className="p-6 md:p-10">
          <div className="grid items-center gap-6 lg:grid-cols-2">
            <div>
              <h1 className="mb-6 text-3xl font-semibold text-foreground">
                Регистрация
              </h1>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Имя</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50" />
                            <Input
                              type="text"
                              placeholder="Иван Иванов"
                              {...field}
                              className="h-12 rounded-xl bg-background border border-foreground/10 pl-10 focus-visible:ring-2 focus-visible:ring-primary/40 transition-all"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50" />
                            <Input
                              type="email"
                              placeholder="you@example.com"
                              {...field}
                              className="h-12 rounded-xl bg-background border border-foreground/10 pl-10 focus-visible:ring-2 focus-visible:ring-primary/40 transition-all"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">
                          Пароль
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50" />
                            <Input
                              type={show ? "text" : "password"}
                              placeholder="••••••••"
                              {...field}
                              className="h-12 rounded-xl bg-background border border-foreground/10 pl-10 pr-10 focus-visible:ring-2 focus-visible:ring-primary/40 transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => setShow((v) => !v)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/60 hover:text-foreground transition-colors"
                            >
                              {show ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="h-11 w-full rounded-full bg-primary text-white shadow-md hover:shadow-lg transition-all"
                    disabled={isLoading}
                  >
                    {isLoading ? "Регистрация..." : "Зарегистрироваться"}
                  </Button>
                  <p className="text-sm text-foreground/70 text-center">
                    Уже есть аккаунт?{" "}
                    <Link href="/login" className="link-gradient font-medium">
                      Войти
                    </Link>
                  </p>
                </form>
              </Form>
            </div>

            <div className="relative hidden lg:block rounded-3xl border border-foreground/10 bg-background/40 overflow-hidden min-h-[260px] md:min-h-[360px]">
              <LottieHero src="/Login.json" className="absolute inset-0" />
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
