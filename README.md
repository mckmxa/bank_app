
## zadanie 1 - zarządzanie osobami

* (pracownik - rola 1) _przy zakładaniu_ - dodatkowe pola na email, rolę;

* walidacja unikalności emaila i odpowiedniej wartości roli;

* generowanie hasła;

* hasło może być podejrzane przez pracownika, ale tylko wtedy gdy nie zostało zmienione przez użytkownika alternatywnie: wygenerowanie tokenu pozwalającego na załadowanie czasowo dostępnej strony do zmiany hasła użytkownika;

* _przy modyfikacji_ - walidacja emaila, roli, regeneracja hasła;

* _przy usuwaniu_ - potwierdzenie tak/nie; alternatywnie: nie usuwamy w ogóle a deaktywujemy konto; ewentualnie usuwamy ale tylko gdy nie zagraża to spójności danych (klient nie ma żadnych transakcji); (klient - rola 2) możliwość zmiany hasła;

* haszowanie hasła (niewygenerowanego).
